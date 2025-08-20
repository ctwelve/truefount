import deepMerge from '@/utilities/deepMerge'
import { describe, it, expect } from 'vitest'

describe('deepMerge', () => {
  it('replaces null without attempting to merge it', () => {
    const target = { a: null }
    const source = { a: { b: 1 } }
    expect(deepMerge(target, source)).toEqual({ a: { b: 1 } })
  })
})
