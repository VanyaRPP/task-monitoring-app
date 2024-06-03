import { expect } from '@jest/globals'
import { parseStringToFloat } from './helpers'

describe('Parse string to float', () => {
  it('Handle 0 values', () => {
    expect(parseStringToFloat('0')).toBe('0')
    expect(parseStringToFloat('0.')).toBe('0')
    expect(parseStringToFloat('0,')).toBe('0')
  })

  it('Handle large floating point values', () => {
    expect(parseStringToFloat('0.0000000003')).toBe('0')
    expect(parseStringToFloat('0,0000000003')).toBe('0')
    expect(parseStringToFloat('-0.0000000003')).toBe('0')
    expect(parseStringToFloat('-0,0000000003')).toBe('0')
  })

  it('Handle .x values', () => {
    expect(parseStringToFloat('123,4')).toBe('123.4')
    expect(parseStringToFloat('123.4')).toBe('123.4')
    expect(parseStringToFloat('-123,4')).toBe('-123.4')
    expect(parseStringToFloat('-123.4')).toBe('-123.4')

    expect(parseStringToFloat('12345678,9')).toBe('12345678.9')
    expect(parseStringToFloat('12345678.9')).toBe('12345678.9')
    expect(parseStringToFloat('-12345678,9')).toBe('-12345678.9')
    expect(parseStringToFloat('-12345678.9')).toBe('-12345678.9')
  })

  it('Handle .x0 values as .x', () => {
    expect(parseStringToFloat('123,40')).toBe('123.4')
    expect(parseStringToFloat('123.40')).toBe('123.4')
    expect(parseStringToFloat('-123,40')).toBe('-123.4')
    expect(parseStringToFloat('-123.40')).toBe('-123.4')

    expect(parseStringToFloat('12345678,90')).toBe('12345678.9')
    expect(parseStringToFloat('12345678.90')).toBe('12345678.9')
    expect(parseStringToFloat('-12345678,90')).toBe('-12345678.9')
    expect(parseStringToFloat('-12345678.90')).toBe('-12345678.9')
  })

  it('Handle .xx values', () => {
    expect(parseStringToFloat('123,45')).toBe('123.45')
    expect(parseStringToFloat('123.45')).toBe('123.45')
    expect(parseStringToFloat('-123,45')).toBe('-123.45')
    expect(parseStringToFloat('-123.45')).toBe('-123.45')

    expect(parseStringToFloat('12345678,99')).toBe('12345678.99')
    expect(parseStringToFloat('12345678.99')).toBe('12345678.99')
    expect(parseStringToFloat('-12345678,99')).toBe('-12345678.99')
    expect(parseStringToFloat('-12345678.99')).toBe('-12345678.99')
  })

  it('Handle .xx0 values as .xx', () => {
    expect(parseStringToFloat('123,450')).toBe('123.45')
    expect(parseStringToFloat('123.450')).toBe('123.45')
    expect(parseStringToFloat('-123,450')).toBe('-123.45')
    expect(parseStringToFloat('-123.450')).toBe('-123.45')

    expect(parseStringToFloat('12345678,990')).toBe('12345678.99')
    expect(parseStringToFloat('12345678.990')).toBe('12345678.99')
    expect(parseStringToFloat('-12345678,990')).toBe('-12345678.99')
    expect(parseStringToFloat('-12345678.990')).toBe('-12345678.99')
  })

  it('Handle .xx(x < 5) values as rounded DOWN .xx', () => {
    expect(parseStringToFloat('123,454')).toBe('123.45')
    expect(parseStringToFloat('123,454')).toBe('123.45')
    expect(parseStringToFloat('-123,454')).toBe('-123.45')
    expect(parseStringToFloat('-123,454')).toBe('-123.45')

    expect(parseStringToFloat('1,001')).toBe('1')
    expect(parseStringToFloat('1.001')).toBe('1')
    expect(parseStringToFloat('-1,001')).toBe('-1')
    expect(parseStringToFloat('-1.001')).toBe('-1')
  })

  it('Handle .xx(x >= 5) values as rounded UP .xx', () => {
    expect(parseStringToFloat('123,459')).toBe('123.46')
    expect(parseStringToFloat('123.459')).toBe('123.46')
    expect(parseStringToFloat('-123,459')).toBe('-123.46')
    expect(parseStringToFloat('-123.459')).toBe('-123.46')

    expect(parseStringToFloat('1,999')).toBe('2')
    expect(parseStringToFloat('1.999')).toBe('2')
    expect(parseStringToFloat('-1,999')).toBe('-2')
    expect(parseStringToFloat('-1.999')).toBe('-2')
  })

  it('Handle unappropriate value', () => {
    expect(parseStringToFloat('')).toBe('0')

    expect(parseStringToFloat(undefined)).toBe('0')
    expect(parseStringToFloat('undefined')).toBe('0')

    expect(parseStringToFloat(null)).toBe('0')
    expect(parseStringToFloat('null')).toBe('0')

    expect(parseStringToFloat(NaN)).toBe('0')
    expect(parseStringToFloat('NaN')).toBe('0')

    expect(parseStringToFloat('label')).toBe('0')

    expect(parseStringToFloat([])).toBe('0')
    expect(parseStringToFloat('[]')).toBe('0')

    expect(parseStringToFloat({})).toBe('0')
    expect(parseStringToFloat('{}')).toBe('0')
  })
})
