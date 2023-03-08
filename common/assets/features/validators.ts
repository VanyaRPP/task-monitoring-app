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
  }
  const email: Rule = {
    type: 'email',
    message: 'Введіть правильну електронну адресу!',
  }
  const phone: Rule = {
    len: 9,
    message: 'Номер телефону має складатися з 9 цифр!',
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
  const electricPrice: Rule = {
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
  const inflaPrice: Rule = {
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

    case 'electricPrice':
      return [required, electricPrice]

    case 'waterPrice':
      return [required, waterPrice]

    case 'inflaPrice':
      return [required, inflaPrice]

    case 'orenda':
      return [required, inflaPrice]

    case 'required':
      return [required]
  }
}
