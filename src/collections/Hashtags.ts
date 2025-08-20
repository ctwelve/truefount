// src/collections/Hashtags.ts
import type { CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugField } from '@/fields/slug'

function toHashtagSlug(input: string): string {
  return input
    ?.toLowerCase()
    .replace(/^#/, '') // strip a leading '#'
    .trim()
    .replace(/\s+/g, '_') // spaces -> underscores
    .replace(/[^a-z0-9_]/g, '') // keep [a-z0-9_]
}

export const Hashtags: CollectionConfig = {
  slug: 'hashtags',
  labels: {
    singular: 'Hashtag',
    plural: 'Hashtags',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    description: 'Canonical set of hashtags used across posts.',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true, // prevents duplicates like "DevOps" x2
      admin: { description: 'Human-facing: e.g., DevOps, Catholicism, Networking.' },
    },
    {
      name: 'description',
      label: 'Description (optional)',
      type: 'textarea',
    },
    {
      name: 'synonyms',
      label: 'Synonyms (optional)',
      type: 'array',
      admin: { description: 'Alternate spellings that should resolve to this hashtag.' },
      fields: [{ name: 'term', type: 'text' }],
    },
    {
      name: 'aliasSlugs',
      label: 'Alias slugs (auto)',
      type: 'array',
      admin: {
        description: 'Auto-derived from Synonyms; used for lookups. Do not edit.',
        readOnly: true,
        disabled: true,
      },
      fields: [{ name: 'slug', type: 'text' }],
    },
    ...slugField(),
  ],
  hooks: {
    beforeValidate: [
      async ({ data }) => {
        if (!data) return

        // Normalize title by removing hashtag prefix and trimming
        if (typeof data.title === 'string') {
          data.title = data.title.replace(/^#/, '').trim()
        }

        // Normalize provided slug or derive one from title
        if (!data.slug) {
          const basis = typeof data.title === 'string' ? data.title : undefined
          if (basis) data.slug = toHashtagSlug(basis)
        } else if (typeof data.slug === 'string') {
          data.slug = toHashtagSlug(data.slug)
        }

        // Normalize synonyms -> trim, drop empties, unique (case-insensitive), strip leading '#'
        if (Array.isArray(data.synonyms)) {
          const cleaned = [] as { term: string }[]
          const seen = new Set<string>()
          for (const item of data.synonyms) {
            if (!item || typeof item.term !== 'string') continue
            const raw = item.term.replace(/^#/, '').trim()
            if (!raw) continue
            const key = raw.toLowerCase()
            if (seen.has(key)) continue
            seen.add(key)
            cleaned.push({ term: raw })
          }
          data.synonyms = cleaned

          // Build aliasSlugs from synonyms using the same slug normalization
          const aliasSet = new Set<string>()
          for (const { term } of cleaned) {
            const s = toHashtagSlug(term)
            if (!s) continue
            aliasSet.add(s)
          }

          // Ensure we never duplicate the primary slug in aliasSlugs
          if (typeof data.slug === 'string') aliasSet.delete(data.slug)

          data.aliasSlugs = Array.from(aliasSet).map((slug) => ({ slug }))
        } else {
          // Ensure aliasSlugs is cleared if synonyms removed
          if (data && 'aliasSlugs' in data) data.aliasSlugs = []
        }
      },
    ],
    beforeChange: [
      async ({ data, req, originalDoc }) => {
        if (!data?.slug) return

        const payload = req.payload
        const meId = originalDoc?.id

        // (1) Does my primary slug collide with anyone else's primary slug or alias slug?
        {
          const { docs } = await payload.find({
            collection: 'hashtags',
            where: {
              and: [
                { id: { not_equals: meId ?? '' } },
                {
                  or: [
                    { slug: { equals: data.slug } },
                    { 'aliasSlugs.slug': { equals: data.slug } },
                  ],
                },
              ],
            },
            limit: 1,
          })

          if (docs?.length) {
            throw new ValidationError({
              errors: [
                {
                  path: 'slug',
                  message: `Slug "${data.slug}" is already used (as a slug or synonym) by "${docs[0].title}".`,
                },
              ],
            })
          }
        }

        // (2) Do any of my alias slugs collide with someone else's primary slug?
        if (Array.isArray(data.aliasSlugs) && data.aliasSlugs.length) {
          const aliasOr = data.aliasSlugs
            .map((x) => x?.slug)
            .filter((s): s is string => typeof s === 'string' && s.length > 0)
            .map((slug) => ({ slug: { equals: slug } }))

          if (aliasOr.length) {
            const { docs } = await payload.find({
              collection: 'hashtags',
              where: {
                and: [{ id: { not_equals: meId ?? '' } }, { or: aliasOr }],
              },
              limit: 1,
            })

            if (docs?.length) {
              throw new ValidationError({
                errors: [
                  {
                    path: 'synonyms',
                    message: `A synonym conflicts with the primary slug of "${docs[0].title}". Remove or change that synonym.`,
                  },
                ],
              })
            }
          }
        }
      },
    ],
  },
  timestamps: true,
}
