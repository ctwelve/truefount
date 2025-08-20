// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: unknown): item is object {
  return item !== null && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export default function deepMerge<T, R>(target: T, source: R): T {
  if (!isObject(target) || !isObject(source)) {
    return source as unknown as T
  }

  const output = { ...target }
  Object.keys(source).forEach((key) => {
    if (isObject(source[key])) {
      if (!(key in target)) {
        Object.assign(output, { [key]: source[key] })
      } else {
        output[key] = deepMerge(target[key], source[key])
      }
    } else {
      Object.assign(output, { [key]: source[key] })
    }
  })

  return output
}
