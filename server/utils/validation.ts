import type { H3Event } from 'h3'
import type { z } from 'zod'

export function parseWith<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input)
  if (result.success) return result.data

  const fields: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_'
    fields[key] ??= issue.message
  }
  fail(422, 'Please fix the highlighted fields.', { fields })
}

export async function validateBody<T extends z.ZodType>(event: H3Event, schema: T) {
  const body = await readBody(event).catch(() => fail(400, 'Invalid request body.'))
  return parseWith(schema, body)
}

export function validateQuery<T extends z.ZodType>(event: H3Event, schema: T) {
  return parseWith(schema, getQuery(event))
}

export function validateParams<T extends z.ZodType>(event: H3Event, schema: T) {
  return parseWith(schema, event.context.params ?? {})
}
