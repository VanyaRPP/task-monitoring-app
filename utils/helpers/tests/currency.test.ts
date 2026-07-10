import {
  normalizeCurrency,
  getCurrencyShortLabel,
  getCurrencySymbol,
  getCurrencyNames,
  currencyWithUnit,
} from '@utils/helpers'

describe('normalizeCurrency', () => {
  it('повертає UAH за замовчуванням якщо undefined', () => {
    expect(normalizeCurrency(undefined)).toBe('UAH')
  })

  it('повертає UAH за замовчуванням якщо порожній рядок', () => {
    expect(normalizeCurrency('')).toBe('UAH')
  })

  it('повертає UAH для невідомої валюти', () => {
    expect(normalizeCurrency('GBP')).toBe('UAH')
  })

  it('нормалізує рядок в нижньому регістрі "usd" -> "USD"', () => {
    expect(normalizeCurrency('usd')).toBe('USD')
  })

  it('нормалізує рядок в нижньому регістрі "eur" -> "EUR"', () => {
    expect(normalizeCurrency('eur')).toBe('EUR')
  })

  it('повертає USD для "USD"', () => {
    expect(normalizeCurrency('USD')).toBe('USD')
  })

  it('повертає EUR для "EUR"', () => {
    expect(normalizeCurrency('EUR')).toBe('EUR')
  })

  it('нормалізує змішаний регістр "Usd" -> "USD"', () => {
    expect(normalizeCurrency('Usd')).toBe('USD')
  })

  it('нормалізує змішаний регістр "EuR" -> "EUR"', () => {
    expect(normalizeCurrency('EuR')).toBe('EUR')
  })

  it('нормалізує змішаний регістр "Uah" -> "UAH"', () => {
    expect(normalizeCurrency('Uah')).toBe('UAH')
  })
})

describe('getCurrencyShortLabel', () => {
  it('повертає "грн" для UAH', () => {
    expect(getCurrencyShortLabel('UAH')).toBe('грн')
  })

  it('повертає "USD" для USD', () => {
    expect(getCurrencyShortLabel('USD')).toBe('USD')
  })

  it('повертає "EUR" для EUR', () => {
    expect(getCurrencyShortLabel('EUR')).toBe('EUR')
  })

  it('повертає "грн" якщо валюта undefined', () => {
    expect(getCurrencyShortLabel(undefined)).toBe('грн')
  })
})

describe('getCurrencySymbol', () => {
  it('повертає "₴" для UAH', () => {
    expect(getCurrencySymbol('UAH')).toBe('₴')
  })

  it('повертає "$" для USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$')
  })

  it('повертає "€" для EUR', () => {
    expect(getCurrencySymbol('EUR')).toBe('€')
  })

  it('повертає "₴" якщо валюта undefined (fallback UAH)', () => {
    expect(getCurrencySymbol(undefined)).toBe('₴')
  })
})

describe('getCurrencyNames', () => {
  it('повертає українські назви для UAH', () => {
    expect(getCurrencyNames('UAH')).toEqual({
      major: 'гривень',
      minor: 'копійок',
    })
  })

  it('повертає назви для USD', () => {
    expect(getCurrencyNames('USD')).toEqual({
      major: 'доларів',
      minor: 'центів',
    })
  })

  it('повертає назви для EUR', () => {
    expect(getCurrencyNames('EUR')).toEqual({ major: 'євро', minor: 'центів' })
  })

  it('повертає UAH назви якщо undefined', () => {
    expect(getCurrencyNames(undefined)).toEqual({
      major: 'гривень',
      minor: 'копійок',
    })
  })
  it('fallback до гривень/копійок для невідомої валюти', () => {
    expect(getCurrencyNames('GBP')).toEqual({
      major: 'гривень',
      minor: 'копійок',
    })
  })
})

describe('currencyWithUnit', () => {
  it('відображає суму з UAH міткою без unit', () => {
    expect(currencyWithUnit(100, 'UAH')).toBe('100 грн')
  })

  it('відображає суму з unit', () => {
    expect(currencyWithUnit(200, 'UAH', 'м²')).toBe('200 грн/м²')
  })

  it('fallback до "грн" якщо валюта undefined', () => {
    expect(currencyWithUnit(100, undefined)).toBe('100 грн')
  })

  it('fallback до "грн" якщо валюта порожній рядок', () => {
    expect(currencyWithUnit(100, '')).toBe('100 грн')
  })

  it('відображає суму з USD міткою без unit', () => {
    expect(currencyWithUnit(100, 'USD')).toBe('100 USD')
  })

  it('відображає суму з EUR міткою без unit', () => {
    expect(currencyWithUnit(100, 'EUR')).toBe('100 EUR')
  })

  it('відображає суму з USD міткою з unit', () => {
    expect(currencyWithUnit(200, 'USD', 'м²')).toBe('200 USD/м²')
  })

  it('нормалізує валюту в нижньому регістрі "usd" -> "USD"', () => {
    expect(currencyWithUnit(100, 'usd')).toBe('100 USD')
  })

  it('fallback до "грн" для невідомої валюти', () => {
    expect(currencyWithUnit(100, 'GBP')).toBe('100 грн')
  })

  it('відображає рядкове значення суми', () => {
    expect(currencyWithUnit('500', 'UAH')).toBe('500 грн')
  })

  it('відображає рядкове значення з unit', () => {
    expect(currencyWithUnit('300', 'USD', 'м²')).toBe('300 USD/м²')
  })
})
