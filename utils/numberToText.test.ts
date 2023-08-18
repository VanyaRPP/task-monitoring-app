export {}
import { expect } from '@jest/globals'
import numberToTextNumber from '@utils/numberToText'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'

setupTestEnvironment()

describe('numberToTextNumber function', () => {
  test('should convert single-digit numbers', () => {
    expect(numberToTextNumber(1)).toBe('одна')
    expect(numberToTextNumber(5)).toBe("п'ять")
  })

  test('should convert two-digit numbers', () => {
    expect(numberToTextNumber(11)).toBe('Одинадцять')
    expect(numberToTextNumber(25)).toBe("Двадцять п'ять")
    expect(numberToTextNumber(37)).toBe('Тридцять сім')
    expect(numberToTextNumber(44)).toBe('Сорок чотири')
    expect(numberToTextNumber(51)).toBe("П'ятдесят одна")
    expect(numberToTextNumber(75)).toBe("Сімдесят п'ять")
    expect(numberToTextNumber(89)).toBe("Вісімдесят дев'ять")
    expect(numberToTextNumber(92)).toBe("Дев'яносто дві")
  })

  test('should convert three-digit numbers', () => {
    expect(numberToTextNumber(100)).toBe('Сто')
    expect(numberToTextNumber(123)).toBe('Сто двадцять три')
    expect(numberToTextNumber(111)).toBe('Сто одинадцять')
    expect(numberToTextNumber(147)).toBe('Сто сорок сім')
    expect(numberToTextNumber(176)).toBe('Сто сімдесят шість')
    expect(numberToTextNumber(232)).toBe('Двісті тридцять дві')
    expect(numberToTextNumber(319)).toBe("Триста дев'ятнадцять")
    expect(numberToTextNumber(487)).toBe('Чотириста вісімдесят сім')
    expect(numberToTextNumber(555)).toBe("П'ятсот п'ятдесят п'ять")
  })

  test('should convert four-digit numbers', () => {
    expect(numberToTextNumber(1111)).toBe('Одна тисяча сто одинадцять')
    expect(numberToTextNumber(1345)).toBe("Одна тисяча триста сорок п'ять")
    expect(numberToTextNumber(1447)).toBe('Одна тисяча чотириста сорок сім')
    expect(numberToTextNumber(2222)).toBe('Дві тисячі двісті двадцять дві')
    expect(numberToTextNumber(2661)).toBe('Дві тисячі шістсот шістдесят одна')
    expect(numberToTextNumber(2984)).toBe(
      "Дві тисячі дев'ятсот вісімдесят чотири"
    )
    expect(numberToTextNumber(3678)).toBe('Три тисячі шістсот сімдесят вісім')
    expect(numberToTextNumber(3954)).toBe(
      "Три тисячі дев'ятсот п'ятдесят чотири"
    )
    expect(numberToTextNumber(4444)).toBe(
      'Чотири тисячі чотириста сорок чотири'
    )
    expect(numberToTextNumber(5123)).toBe("П'ять тисяч сто двадцять три")
    expect(numberToTextNumber(6234)).toBe('Шість тисяч двісті тридцять чотири')
    expect(numberToTextNumber(7345)).toBe("Сім тисяч триста сорок п'ять")
    expect(numberToTextNumber(8384)).toBe(
      'Вісім тисяч триста вісімдесят чотири'
    )
  })
})
