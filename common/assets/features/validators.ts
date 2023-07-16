import { Rule } from 'antd/lib/form'

//Normalizers
export const allowOnlyNumbers = (value: string): string =>
  value.replace(/[^+\d]/g, '')

export const deleteExtraWhitespace = (value: string): string =>
  value
    .replace(/(#[\wа-яё]+)/gi, '')
    .replace(/[ ]+/g, ' ')
    .trimStart()

//Validators


export const validateField = (name: string): Rule[] => {
  const required: Rule = {
    required: true,
    message: "Поле обов'язкове!",
  };

const email: Rule = {
  validator(_, value) {
      // TODO: fix tests
      // emailRegex.test(value) fix case mykola.ext@gmail.com
    if (!value) {
      return Promise.resolve(); // Allow empty value
    }

    const emails = Array.isArray(value) ? value : [value];
    const invalidEmails = emails.filter(email => !/^([a-zA-Z0-9.]{6,30})@([a-zA-Z]+(\.[a-zA-Z]+)+)$/.test(email));

    if (invalidEmails.length > 0) {
      return Promise.reject(new Error('Введіть правильну електронну адресу!'));
    }

    return Promise.resolve();
  },
};
  
  const phone: Rule = {
    validator(_, value) {
      if (
        !value ||
        /^[\+]?3?[\s]?8?[\s]?\(?0\d{2}?\)?[\s]?\d{3}[\s|-]?\d{2}[\s|-]?\d{2}$/.test(
          value
        )
      ) {
        return Promise.resolve()
      }
      return Promise.reject(
        new Error('Введіть правильний номер телефону починаючи з +380 !')
      )
    },
  }
  const password: Rule = {
    min: 8,
    message: 'Пароль має складатися з 8 символів!',
  }
  const paymentPrice: Rule = {
    type: 'number',
    min: 1,
    max: 200000,
    message: 'Сума рахунку повинна бути в межах [1, 200000]',
  }
  const electricityPrice: Rule = {
    type: 'number',
    min: 1,
    max: 200000,
    message: 'Сума рахунку повинна бути в межах [1, 200000]',
  }
  const waterPrice: Rule = {
    type: 'number',
    min: 1,
    max: 200000,
    message: 'Сума рахунку повинна бути в межах [1, 200000]',
  }
  const inflicionPrice: Rule = {
    type: 'number',
    min: 1,
    max: 200000,
    message: 'Сума рахунку повинна бути в межах [1, 200000]',
  }
  const rentPrice: Rule = {
    type: 'number',
    min: 1,
    max: 200000,
    message: 'Сума рахунку повинна бути в межах [1, 200000]',
  }

  const price: Rule = {
    validator(_, value) {
      if (value > 0 || !value) {
        return Promise.resolve()
      }
      return Promise.reject(
        new Error(
          `${
            name[0].toUpperCase() + name.slice(1)
          } не може бути менше або дорівнювати 0`
        )
      )
    },
  }

  switch (name) {
    case 'name':
      return [required]

    case 'email':
      return [required, email]

    case 'address':
      return [required]

    case 'description':
      return [required]

    case 'phone':
      return [required, phone]

    case 'deadline':
      return [required]

    case 'price':
      return [required, price]

    case 'feedback':
      return [required]

    case 'comment':
      return [required]

    case 'password':
      return [required, password]

    case 'paymentPrice':
      return [required, paymentPrice]

    case 'electricityPrice':
      return [required, electricityPrice]

    case 'waterPrice':
      return [required, waterPrice]

    case 'inflicionPrice':
      return [required, inflicionPrice]

    case 'rentPrice':
      return [required, rentPrice]

    case 'required':
      return [required]
    
      default:
      return [required];
  }
};

