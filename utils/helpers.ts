import User from '@common/modules/models/User'
import { FormInstance } from 'antd'
import { ObjectId } from 'mongoose'
import { Roles } from './constants'
import { PaymentOptions } from './types'

export const firstTextToUpperCase = (text: string) =>
  text[0].toUpperCase() + text.slice(1)

export const getCount = (tasks: any, name: string) => {
  return tasks?.filter((task) => task?.category == name)
}
export const getModifiedObjectOfFormInstance = (
  form: FormInstance<any>,
  values: { name: string; value: any }[]
) => {
  const fields = form.getFieldsValue()
  values.map((item) => Object.assign(fields, { [item.name]: item.value }))
  return fields
}

export const getFormattedAddress = (address: string) => {
  if (address) {
    const addressChunks = address.split(',')
    if (
      addressChunks[0].includes('вулиця') ||
      addressChunks[0].includes('вул') ||
      addressChunks[0].includes('улица')
    ) {
      if (
        parseInt(addressChunks[1]) &&
        parseInt(addressChunks[1]) === parseInt(addressChunks[1])
      ) {
        return `${addressChunks[0]}, ${addressChunks[1]}`
      }
      return addressChunks[0]
    } else return addressChunks.join(', ')
  }
}

export const getPaymentOptions = async ({
  searchEmail,
  userEmail,
}: PaymentOptions) => {
  const options: { payer?: string | ObjectId } = {}
  // searching for original user
  const user = await User.findOne({ email: userEmail })

  const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)

  if (isGlobalAdmin) {
    if (searchEmail) {
      // 1. admin looking for someone items
      const searchUser = await User.findOne({ email: searchEmail })
      // TODO: what if user not exists? if (!searchUser) {}

      options.payer = searchUser._id
      return options
    }

    // 2. admin looking for all items
    return options
  }

  // 3. user can see only his items
  options.payer = user._id

  return options
}

export const getName = (name, obj) => {
  let key = null
  Object.entries(obj).forEach(([field, value]) => {
    if (name === field) {
      key = value
    }
  })
  return key
}

export function numberToTextNumber(number) {
  const k = [
      'одна тисяча',
      'дві тисячі',
      'три тисячі',
      'чотири тисячі',
      "п'ять тисяч",
      'шість тисяч',
      'сім тисяч',
      'вісім тисяч',
      "дев'ять тисяч",
    ],
    h = [
      'сто',
      'двісті',
      'триста',
      'чотириста',
      "п'ятсот",
      'шість сотень',
      'сімсот',
      'вісімсот',
      "дев'ятсот",
    ],
    t = [
      '',
      'двадцять',
      'тридцять',
      'сорок',
      "п'ятдесят",
      'шістдесят',
      'сімдесят',
      'вісімдесят',
      "дев'яносто",
    ],
    o = [
      'один',
      'два',
      'три',
      'чотири',
      "п'ять",
      'шість',
      'сім',
      'вісім',
      "дев'ять",
    ],
    p = [
      'одиннадцять',
      'дванадцять',
      'тринадцять',
      'чотирнадцять',
      "п'ятнадцять",
      'шістнадцять',
      'сімнадцять',
      'вісімнадцять',
      "де'ятнадцять",
    ]

  const str = number.toString()
  let out = ''
  if (str.length == 1) return o[number - 1]
  else if (str.length == 2) {
    if (str[0] == 1) out = p[parseInt(str[1]) - 1]
    else
      out =
        t[parseInt(str[0]) - 1] +
        (str[1] != '0' ? ' ' + o[parseInt(str[1]) - 1] : '')
  } else if (str.length == 3) {
    if (str[1] == 1)
      out =
        h[parseInt(str[0]) - 1] +
        (str[1] != '0' ? ' ' + p[parseInt(str[2]) - 1] : '')
    else
      out =
        h[parseInt(str[0]) - 1] +
        (str[1] != '0' ? ' ' + t[parseInt(str[1]) - 1] : '') +
        (str[2] != '0' ? ' ' + o[parseInt(str[2]) - 1] : '')
  } else if (str.length == 4) {
    if (str[2] == 1)
      out =
        k[parseInt(str[0]) - 1] +
        (str[1] != '0' ? ' ' + h[parseInt(str[1]) - 1] : '') +
        (str[2] != '0' ? ' ' + p[parseInt(str[3]) - 1] : '')
    else
      out =
        k[parseInt(str[0]) - 1] +
        (str[1] != '0' ? ' ' + h[parseInt(str[1]) - 1] : '') +
        (str[2] != '0' ? ' ' + t[parseInt(str[2]) - 1] : '') +
        (str[3] != '0' ? ' ' + o[parseInt(str[3]) - 1] : '')
  }

  const arr = out.split('')
  arr[0] = typeof arr?.[0] === 'string' ? arr[0].toUpperCase() : ''
  out = arr.join('')
  return out
}

export const isAdminCheck = (roles) => {
  return [Roles.GLOBAL_ADMIN, Roles.DOMAIN_ADMIN].some((role) =>
    roles?.includes(role)
  )
}

/**
 * костиль, щоб прибрати `__v` з документу `mongodb` і далі порівнювати
 * отримані дані із тестовими
 * @param data масив документів `mongo_object_response._doc`
 * @returns масив документів без поля `__v`
 */
export const removeVersion = (data: any[]): any[] =>
  data.map((obj) => {
    const { __v, ...rest } = obj
    return rest
  })
