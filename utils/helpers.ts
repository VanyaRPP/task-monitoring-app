import User from '@common/modules/models/User'
import { FormInstance } from 'antd'
import { ObjectId } from 'mongoose'
import { Roles, ServiceType } from './constants'
import { PaymentOptions } from './types'
import moment from 'moment'
import 'moment/locale/uk'

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

export const isAdminCheck = (roles) => {
  return [Roles.GLOBAL_ADMIN, Roles.DOMAIN_ADMIN].some((role) =>
    roles?.includes(role)
  )
}

export function getPlainJsObjectFromMongoose(dataArray) {
  return dataArray.map((doc) => {
    const plainObject = {}

    for (const key in doc._doc) {
      if (doc._doc.hasOwnProperty(key)) {
        plainObject[key] = doc._doc[key]
      }
    }

    return plainObject
  })
}

export function composeFunctions(input, functions) {
  return functions.reduce((result, func) => func(result), input)
}

/**
 * Костиль, щоб прибрати `__v` з документу `mongodb` і далі порівнювати
 * отримані дані із тестовими
 * @param {any[]} data масив документів `mongo_object_response._doc`
 * @returns {any[]} масив документів без поля `__v`
 */
export const removeVersion = (data: any[]): any[] =>
  data.map((obj) => {
    const { __v, ...rest } = obj
    return rest
  })

/**
 * Ще один костиль для тестів, щоб зробити `reverse populate` документу
 * `mongodb` для подальшого порівняння із тестовими даними
 * @param {any[]} data масив документів `mongo_object_response`
 * @returns {any[]} масив документів без `populate`
 */
export const unpopulate = (arr: any[]): any[] => {
  return arr.map((obj) => {
    const newObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (obj[key] && obj[key]._id) {
          newObj[key] = obj[key]._id.toString()
        } else {
          newObj[key] = obj[key]
        }
      }
    }
    return newObj
  })
}

/**
 * Переводить `Date` в `string` місяця на українській і з великої літери
 * @param {Date} date дата
 * @returns форматований місяць
 */
export const DateToFormattedMonth = (date?: Date): string => {
  const month = moment(date).locale('uk').format('MMMM')
  return month[0].toUpperCase() + month.slice(1)
}

export function filterInvoiceObject(obj) {
  const filtered = []
  const services: string[] = Object.values(ServiceType)

  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key].hasOwnProperty('sum')) {
      services.includes(key)
        ? filtered.push({
            type: key,
            ...obj[key],
          })
        : filtered.push({
            type: ServiceType.Custom,
            name: key,
            ...obj[key],
          })
    }
  }

  return filtered
}
