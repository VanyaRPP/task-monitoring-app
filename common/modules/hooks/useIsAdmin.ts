import { useMemo } from 'react'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { Roles } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'

export interface UseIsAdminResult {
  isDomainAdmin: boolean
  isGlobalAdmin: boolean
  /** True for DomainAdmin or GlobalAdmin. */
  isAdmin: boolean
}

/**
 * Resolves the current user's admin role on the client.
 *
 * Mirrors the role-derivation used in the sidebar `Menu` (roles come from
 * `useGetCurrentUserQuery`, not the session, since the session may not carry
 * roles). Centralised here so multiple components (Menu, AIChat gate, ...) do
 * not duplicate the same `roles.includes(...)` logic.
 */
export function useIsAdmin(): UseIsAdminResult {
  const { data: user } = useGetCurrentUserQuery()

  const roles = useMemo<string[]>(() => {
    const r = (user as any)?.roles ?? (user as any)?.role
    return Array.isArray(r) ? r : r ? [r] : []
  }, [user])

  return useMemo(
    () => ({
      isDomainAdmin: roles.includes(Roles.DOMAIN_ADMIN),
      isGlobalAdmin: roles.includes(Roles.GLOBAL_ADMIN),
      isAdmin: isAdminCheck(roles),
    }),
    [roles]
  )
}
