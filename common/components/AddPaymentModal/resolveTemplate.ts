export type TemplateKey =
  | 'classic'
  | 'olimp'
  | 'swiss'
  | 'softcard'
  | 'techstudio'
  | 'monoline'
  | 'editorial'
  | 'ledger'
  | 'azure'

const DEFAULT_TEMPLATE: TemplateKey = 'classic'

export function resolveTemplate(
  paymentTemplate: string | undefined,
  companyDefaultTemplate: string | undefined,
  domainDefaultTemplate: string | undefined
): TemplateKey {
  return (paymentTemplate ||
    companyDefaultTemplate ||
    domainDefaultTemplate ||
    DEFAULT_TEMPLATE) as TemplateKey
}
