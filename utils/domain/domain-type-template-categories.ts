import { DomainTypeTemplateCategory } from '@common/api/domainApi/domain.api.types'

export const DOMAIN_TYPE_TEMPLATE_CATEGORY_LABELS: Record<
  DomainTypeTemplateCategory,
  string
> = {
  utility: 'Комунальні',
  it: 'IT',
  edu: 'Освіта',
  auto: 'Авто',
  'real-estate': 'Нерухомість',
  other: 'Інше',
}

export const DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS: {
  value: DomainTypeTemplateCategory
  label: string
}[] = (
  Object.keys(DOMAIN_TYPE_TEMPLATE_CATEGORY_LABELS) as DomainTypeTemplateCategory[]
).map((value) => ({
  value,
  label: DOMAIN_TYPE_TEMPLATE_CATEGORY_LABELS[value],
}))

export function getDomainTypeTemplateCategoryLabel(
  category: DomainTypeTemplateCategory | string | undefined
): string {
  if (!category) return DOMAIN_TYPE_TEMPLATE_CATEGORY_LABELS.other
  return (
    DOMAIN_TYPE_TEMPLATE_CATEGORY_LABELS[
      category as DomainTypeTemplateCategory
    ] ?? category
  )
}
