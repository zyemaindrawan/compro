import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Required').max(200),
})

export const mfaCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  factorId: z.uuid().optional(),
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required').max(200),
    password: z
      .string()
      .min(12, 'Use at least 12 characters')
      .max(200)
      .regex(/[a-z]/, 'Add a lowercase letter')
      .regex(/[A-Z]/, 'Add an uppercase letter')
      .regex(/\d/, 'Add a number'),
    confirm: z.string(),
  })
  .refine(value => value.password === value.confirm, { error: 'Passwords do not match', path: ['confirm'] })

export const profileSchema = z.object({
  display_name: z.string().trim().min(1, 'Required').max(80),
  bio: z.string().trim().max(500),
  avatar_media_id: z.uuid().nullable(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type MfaCodeInput = z.infer<typeof mfaCodeSchema>
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>
export type ProfileInput = z.infer<typeof profileSchema>
