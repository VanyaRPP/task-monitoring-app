export {} 
 import { numberToTextNumber } from '@utils/numberToText';  // Update the path accordingly


describe('numberToTextNumber function', () => {
  test('should convert single-digit numbers', () => {
    if (numberToTextNumber(1) === "Один") {
      console.log('Test passed');
    } else {
      console.error('Test failed');
    }

    if (numberToTextNumber(5) === "П'ять") {
      console.log('Test passed');
    } else {
      console.error('Test failed');
    }
  });

  test('should convert three-digit numbers', () => {
    if (numberToTextNumber(100) === "Сто") {
      console.log('Test passed');
    } else {
      console.error('Test failed');
    }

    if (numberToTextNumber(123) === "Сто двадцять три") {
      console.log('Test passed');
    } else {
      console.error('Test failed');
    }

    if (numberToTextNumber(111) === "Сто одинадцять") {
      console.log('Test passed');
    } else {
      console.error('Test failed');
    }

    // Додайте тестові перевірки для інших трьохзначних чисел
  });

  test('should convert four-digit numbers', () => {
    // ... попередні перевірки ...

    if (numberToTextNumber(4444) === "Чотири тисячі чотириста сорок чотири") {
      console.log('Test passed');
    } else {
      console.error('Test failed');
    }

    // Додайте тестові перевірки для інших чотирьохзначних чисел
  });
});