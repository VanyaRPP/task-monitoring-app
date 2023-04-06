import User from '@common/modules/models/User'
import { FormInstance } from 'antd'
import { ObjectId } from 'mongoose'
import { Roles } from './constants'
import { PaymentOptions } from './types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { dateToYearMonthFormat } from '@common/assets/features/formatDate'

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

  const isAdmin = user?.role === Roles.ADMIN

  if (isAdmin) {
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

export const getCurrentMonthService = (services: IService[]) => {
  const filteredServices = services?.find((s) => {
    return dateToYearMonthFormat(s?.data) === dateToYearMonthFormat(new Date())
  })
  return filteredServices
}
