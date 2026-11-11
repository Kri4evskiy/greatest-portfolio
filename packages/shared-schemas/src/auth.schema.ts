import { z } from 'zod'
import { RoleEnum, VisitorRoleTypeEnum } from './roles.schema.js'

export const KB_ACCESS_COOKIE_NAME = 'kb_access_token'
export const KB_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7 // 7 days
export const DEFAULT_DEV_JWT_SECRET = 'workfolio-super-secret-jwt-key-2026'

export function resolveJwtSecret(envSecret?: string): string {
  const trimmed = envSecret?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_DEV_JWT_SECRET
}

export const GuestPassFormSchema = z.object({
  displayName: z.string().trim().min(2, 'Введите имя или никнейм (минимум 2 символа)').max(50, 'Максимум 50 символов'),
  visitorType: VisitorRoleTypeEnum,
  adminPasscode: z.string().trim().max(100).optional(),
})

export type GuestPassFormInput = z.infer<typeof GuestPassFormSchema>

export const SessionProfileSchema = z.object({
  id: z.uuid().nullable(),
  displayName: z.string().nullable(),
  visitorType: VisitorRoleTypeEnum.nullable(),
  role: RoleEnum,
  expiresAt: z.iso.datetime().nullable(),
})

export type SessionProfile = z.infer<typeof SessionProfileSchema>
