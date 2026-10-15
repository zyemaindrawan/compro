import { SLUG_MAX_LENGTH } from '../constants'

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugify(input: string, maxLength = SLUG_MAX_LENGTH) {
  const slug = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (slug.length <= maxLength) return slug

  const cut = slug.slice(0, maxLength)
  const lastHyphen = cut.lastIndexOf('-')
  return (lastHyphen > maxLength / 2 ? cut.slice(0, lastHyphen) : cut).replace(/-+$/, '')
}
