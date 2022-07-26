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
    message: `${name[0].toUpperCase() + name.slice(1)} is required!`,
  }
  const email: Rule = {
    type: 'email',
    message: 'Please input correct email!',
  }
  const phone: Rule = { len: 9, message: 'Phone number should have 9 digits!' }

  const price: Rule = {
    validator(_, value) {
      if (value > 0 || !value) {
        return Promise.resolve()
      }
      return Promise.reject(
        new Error(
          `${name[0].toUpperCase() + name.slice(1)} can not be less or equal 0`
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
  }
}
