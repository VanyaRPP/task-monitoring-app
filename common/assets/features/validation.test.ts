import { emailRegex } from './validators'
const { expect, test, toBeTruthy, toBeFalsy } = require('@jest/globals')

describe('isValidValidation', () => {
  test('email is valid', () => {
    expect(emailRegex.test('pluserwork24@gmail.com')).toBeTruthy()
    expect(emailRegex.test('exampletest@mail.ua')).toBeTruthy()
    expect(emailRegex.test('my.yershov@gmail.com')).toBeTruthy()
  })
  test('email is invalid', () => {
    expect(emailRegex.test('example@2mail.con')).toBeFalsy()
    expect(emailRegex.test('example2!2@<mail.con')).toBeFalsy()
  })
})
