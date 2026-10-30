import { z } from 'zod'
import { RoleEnum, VisitorRoleTypeEnum } from './roles.schema.js'

export const GuestPassFormSchema = z.object({
  displayName: z.string().trim().min(2, 'Введите имя или никнейм (минимум 2 символа)').max(50, 'Максимум 50 символов'),
  visitorType: VisitorRoleTypeEnum,
  adminPasscode: z.string().trim().max(100).optional(),
})

export type GuestPassFormInput = z.infer<typeof GuestPassFormSchema>

export const SessionProfileSchema = z.object({
  id: z.string().uuid().nullable(),
  displayName: z.string().nullable(),
  visitorType: VisitorRoleTypeEnum.nullable(),
  role: RoleEnum,
  expiresAt: z.string().datetime().nullable(),
})

export type SessionProfile = z.infer<typeof SessionProfileSchema>
