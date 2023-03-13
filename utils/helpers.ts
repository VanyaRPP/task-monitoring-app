import { FormInstance } from 'antd'
import { ObjectId } from 'mongoose'
import { IBeParams, IOptionsParams } from './types'

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

export const getPaymentsOptions = (params: IOptionsParams) => {
  const options: { limit: number; userId?: string } = { limit: params.limit }
  if (params.isAdmin && params.email) {
    options.userId = params.email
  }
  if (!params.isAdmin && params.userId) {
    options.userId = params.userId
  }
  return options
}

export const getPaymentsOnBE = (params: IBeParams) => {
  const options: { payer?: { _id: string | ObjectId } } = {}
  if (params.isAdmin && params.req) {
    options.payer = { _id: params.userId }
  }
  if (!params.isAdmin && params.req) {
    options.payer = { _id: params.req }
  }
  return options
}
