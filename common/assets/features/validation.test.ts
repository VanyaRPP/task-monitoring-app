import { emailRegex, isValidEmail } from './validators'

describe('emailRegex', () => {
  test('email is valid', () => {
    expect(emailRegex.test('pluserwork24@gmail.com')).toBeTruthy()
    expect(emailRegex.test('exampletest@mail.ua')).toBeTruthy()
    expect(emailRegex.test('qwe.sdf@gmail.com')).toBeTruthy()
  })
  test('email with custom TLDs is valid', () => {
    expect(emailRegex.test('mykola@consideritdone.tech')).toBeTruthy()
    expect(emailRegex.test('user@company.io')).toBeTruthy()
    expect(emailRegex.test('hello@startup.ai')).toBeTruthy()
    expect(emailRegex.test('contact@firm.agency')).toBeTruthy()
    expect(emailRegex.test('dev@team.dev')).toBeTruthy()
    expect(emailRegex.test('info@creative.studio')).toBeTruthy()
    expect(emailRegex.test('me@personal.me')).toBeTruthy()
    expect(emailRegex.test('support@brand.co')).toBeTruthy()
    expect(emailRegex.test('hello@company.solutions')).toBeTruthy()
    expect(emailRegex.test('work@studio.design')).toBeTruthy()
    expect(emailRegex.test('pro@service.pro')).toBeTruthy()
    expect(emailRegex.test('press@news.media')).toBeTruthy()
    expect(emailRegex.test('info@shop.online')).toBeTruthy()
    expect(emailRegex.test('admin@myproject.site')).toBeTruthy()
    expect(emailRegex.test('user@project.space')).toBeTruthy()
    expect(emailRegex.test('team@agency.digital')).toBeTruthy()
    expect(emailRegex.test('ask@consult.expert')).toBeTruthy()
    expect(emailRegex.test('ops@infra.systems')).toBeTruthy()
  })
  test('local-part with + and - is valid', () => {
    expect(emailRegex.test('user+tag@gmail.com')).toBeTruthy()
    expect(emailRegex.test('o-brien@mail.com')).toBeTruthy()
  })
  test('domain with digits is valid', () => {
    expect(emailRegex.test('user@office365.com')).toBeTruthy()
    expect(emailRegex.test('user@mail1.com')).toBeTruthy()
    expect(emailRegex.test('user@web3.io')).toBeTruthy()
  })
  test('email is invalid', () => {
    expect(emailRegex.test('example2!2@<mail.con')).toBeFalsy()
    expect(emailRegex.test('notanemail')).toBeFalsy()
    expect(emailRegex.test('@nodomain.tech')).toBeFalsy()
    expect(emailRegex.test('missing@')).toBeFalsy()
    expect(emailRegex.test('spaces in@email.dev')).toBeFalsy()
    expect(emailRegex.test('double@@domain.io')).toBeFalsy()
    expect(emailRegex.test('.startwithdot@domain.ai')).toBeFalsy()
    expect(emailRegex.test('user@.nodot.studio')).toBeFalsy()
    expect(emailRegex.test('user@domain.')).toBeFalsy()
    expect(emailRegex.test('user@domain.c')).toBeFalsy()
    expect(emailRegex.test('a..b@domain.com')).toBeFalsy()
    expect(emailRegex.test('user@-mail.com')).toBeFalsy()
  })
})

describe('isValidEmail', () => {
  test('returns false for non-string inputs', () => {
    expect(isValidEmail(undefined)).toBeFalsy()
    expect(isValidEmail(null)).toBeFalsy()
    expect(isValidEmail(123)).toBeFalsy()
    expect(isValidEmail({})).toBeFalsy()
  })
  test('returns false for empty string and empty array', () => {
    expect(isValidEmail('')).toBeFalsy()
    expect(isValidEmail([])).toBeFalsy()
  })
  test('trims surrounding whitespace', () => {
    expect(isValidEmail('  ok@example.com  ')).toBeTruthy()
  })
  test('validates an array of emails', () => {
    expect(isValidEmail(['a@x.com', 'b@y.io'])).toBeTruthy()
    expect(isValidEmail(['a@x.com', 'broken'])).toBeFalsy()
    expect(isValidEmail(['a@x.com', undefined as unknown as string])).toBeFalsy()
  })
})
