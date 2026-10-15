import { z } from 'zod'
import { REDIRECT_RESERVED_PATH, REDIRECT_SKIPPED_FILE, REDIRECT_STATUS_CODES } from '../constants'
import { normalizePath } from '../utils/redirect-graph'

const fromPath = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(300)
  .regex(/^\/[^\s?#]*$/, 'Start with / and leave out ? and #')
  .transform(normalizePath)
  .refine(path => path !== '/', 'The home page cannot be redirected')
  .refine(path => !REDIRECT_RESERVED_PATH.test(path), 'Paths under /admin, /api and /_nuxt cannot be redirected')
  .refine(path => !REDIRECT_SKIPPED_FILE.test(path), 'Asset files cannot be redirected')

const toPath = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(500)
  .refine(
    value => /^\/(?!\/)\S*$/.test(value) || /^https?:\/\/\S+$/.test(value),
    'Use a path starting with / or a full URL starting with https://',
  )

export const redirectSchema = z
  .object({
    from_path: fromPath,
    to_path: toPath,
    status_code: z.union(REDIRECT_STATUS_CODES.map(code => z.literal(code))),
  })
  .refine(rule => rule.to_path.split(/[?#]/)[0] !== rule.from_path, {
    error: 'The target must differ from the old path',
    path: ['to_path'],
  })

export const redirectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().trim().max(100).optional(),
})

export type RedirectInput = z.infer<typeof redirectSchema>
export type RedirectQuery = z.infer<typeof redirectQuerySchema>
