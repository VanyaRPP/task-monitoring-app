export {}
import { numberToTextNumber } from '@utils/numberToText' // Update the path accordingly

describe('numberToTextNumber function', () => {
  test('should convert single-digit numbers', () => {
    if (numberToTextNumber(1) === 'одна') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(5) === "п'ять") {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }
  })

  test('should convert two-digit numbers', () => {
    if (numberToTextNumber(11) === 'Одинадцять') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(25) === "Двадцять п'ять") {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(37) === 'Тридцять сім') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(44) === 'Сорок чотири') {
      console.log('Test passed for 44')
    } else {
      console.error('Test failed for 44')
    }

    if (numberToTextNumber(51) === "П'ятдесят одна") {
      console.log('Test passed for 51')
    } else {
      console.error('Test failed for 51')
    }

    if (numberToTextNumber(75) === "Сімдесят п'ять") {
      console.log('Test passed for 75')
    } else {
      console.error('Test failed for 75')
    }

    if (numberToTextNumber(89) === "Вісімдесят дев'ять") {
      console.log('Test passed for 89')
    } else {
      console.error('Test failed for 89')
    }

    if (numberToTextNumber(92) === "Дев'яносто дві") {
      console.log('Test passed for 92')
    } else {
      console.error('Test failed for 92')
    }
    // Додайте тестові перевірки для інших двозначних чисел
  })

  test('should convert three-digit numbers', () => {
    if (numberToTextNumber(100) === 'Сто') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(123) === 'Сто двадцять три') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(111) === 'Сто одинадцять') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(147) === 'Сто сорок сім') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(176) === 'Сто сімдесят шість') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(232) === 'Двісті тридцять дві') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(319) === "Триста дев'ятнадцять") {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(487) === 'Чотириста вісімдесят сім') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(555) === "П'ятсот п'ятдесят п'ять") {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    // Додайте тестові перевірки для інших трьохзначних чисел
  })

  test('should convert four-digit numbers', () => {
    if (numberToTextNumber(1111) === 'Одна тисяча сто одинадцять') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(1345) === "Одна тисяча триста сорок п'ять") {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(1447) === 'Одна тисяча чотириста сорок сім') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(2222) === 'Дві тисячі двісті двадцять дві') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(2661) === 'Дві тисячі шістсот шістдесят одна') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(2984) === "Дві тисячі дев'ятсот вісімдесят чотири") {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(3678) === 'Три тисячі шістсот сімдесят вісім') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(3954) === "Три тисячі дев'ятсот п'ятдесят чотири") {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(4444) === 'Чотири тисячі чотириста сорок чотири') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }

    if (numberToTextNumber(8384) === 'Вісім тисяч триста вісімдесят чотири') {
      console.log('Test passed')
    } else {
      console.error('Test failed')
    }
    // Додайте тестові перевірки для інших чотирьохзначних чисел
  })
})
