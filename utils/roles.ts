export const ROLE_PRIORITY = ['GlobalAdmin', 'DomainAdmin', 'User'] as const

export type Role = (typeof ROLE_PRIORITY)[number]

export function pickHighestRole(input?: string[] | string): Role {
  const roles = Array.isArray(input) ? input : input ? [input] : []
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) return r
  }
  return 'User'
}

export function normalizeRoles(input?: string[] | string): Role[] {
  return [pickHighestRole(input)]
}
