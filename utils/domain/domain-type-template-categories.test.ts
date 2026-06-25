import {
  getDomainTypeTemplateCategoryLabel,
  DOMAIN_TYPE_TEMPLATE_CATEGORY_LABELS,
  DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS,
} from './domain-type-template-categories'

describe('getDomainTypeTemplateCategoryLabel', () => {
  it.each([
    ['utility', 'Комунальні'],
    ['it', 'IT'],
    ['edu', 'Освіта'],
    ['auto', 'Авто'],
    ['real-estate', 'Нерухомість'],
    ['other', 'Інше'],
  ])('%s → %s', (input, expected) => {
    expect(getDomainTypeTemplateCategoryLabel(input)).toBe(expected)
  })

  it('невідомий ключ → повертає сам ключ', () => {
    expect(getDomainTypeTemplateCategoryLabel('unknown')).toBe('unknown')
  })

  it('undefined → Інше', () => {
    expect(getDomainTypeTemplateCategoryLabel(undefined)).toBe('Інше')
  })
})

describe('DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS', () => {
  it('має запис на кожен ключ з правильним label', () => {
    const keys = Object.keys(DOMAIN_TYPE_TEMPLATE_CATEGORY_LABELS)
    expect(DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS).toHaveLength(keys.length)
    DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS.forEach((opt) => {
      expect(opt.label).toBe(DOMAIN_TYPE_TEMPLATE_CATEGORY_LABELS[opt.value])
    })
  })
})
