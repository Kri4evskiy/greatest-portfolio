import { z } from 'zod'

export const RoleEnum = z.enum(['GUEST', 'USER', 'ADMIN'])
export type Role = z.infer<typeof RoleEnum>

export const VisitorRoleTypeEnum = z.enum(['TEAM_LEAD', 'RECRUITER', 'DEVELOPER', 'FOUNDER', 'OTHER'])
export type VisitorRoleType = z.infer<typeof VisitorRoleTypeEnum>

export const VISITOR_ROLE_LABELS: Record<VisitorRoleType, string> = {
  TEAM_LEAD: 'Team Lead / Tech Lead',
  RECRUITER: 'Tech Recruiter / HR',
  DEVELOPER: 'Software Engineer',
  FOUNDER: 'CTO / Founder',
  OTHER: 'Guest / Explorer',
}
