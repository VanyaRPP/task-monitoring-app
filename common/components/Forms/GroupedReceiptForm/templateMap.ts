import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { TemplateProps } from './templates/types'

export type BuiltinTemplateKey = 'classic' | 'olimp' | 'ledger' | 'official'

export const templateMap: Record<string, ComponentType<TemplateProps>> = {
  classic: dynamic(() => import('./templates/classic'), { ssr: false }),
  ledger: dynamic(() => import('./templates/ledger'), { ssr: false }),
  olimp: dynamic(() => import('./templates/olimp'), { ssr: false }),
  official: dynamic(() => import('./templates/official'), { ssr: false }),
}

export function resolveBuiltinTemplateKey(
  data: any
): BuiltinTemplateKey {
  const candidate =
    data?.template ||
    (typeof data?.company === 'object'
      ? data?.company?.defaultTemplate
      : undefined) ||
    (typeof data?.domain === 'object'
      ? data?.domain?.defaultTemplate
      : undefined) ||
    'classic'

  if (candidate in templateMap) {
    return candidate as BuiltinTemplateKey
  }
  return 'classic'
}
