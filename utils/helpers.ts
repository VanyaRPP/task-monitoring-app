import { IProvider, IReciever } from '@common/api/paymentApi/payment.api.types'
import User, { IUser } from '@modules/models/User'
import { FormInstance } from 'antd'
import Big from 'big.js'
import moment from 'moment'
import 'moment/locale/uk'
import mongoose, { ObjectId } from 'mongoose'
import { Roles, ServiceType } from './constants'
import {
  getDomainsPipeline,
  getRealEstatesPipeline,
  getStreetsPipeline,
} from './pipelines'
import { PaymentOptions } from './types'

export const toFirstUpperCase = (text: string) =>
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

export const isAdminCheck = (roles?: string[]): boolean => {
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

export function parseReceived(data) {
  return composeFunctions(data, [
    getPlainJsObjectFromMongoose,
    unpopulate,
    removeProps,
    formatDateToIsoString,
  ])
}

export function compareDates(date1, date2) {
  const dateA = new Date(date1)
  const dateB = new Date(date2)

  if (dateA > dateB) {
    return -1
  } else if (dateA < dateB) {
    return 1
  } else {
    return 0
  }
}

function formatDateToIsoString(data) {
  return data.map((i) =>
    i.invoiceCreationDate
      ? {
          ...i,
          invoiceCreationDate: new Date(i.invoiceCreationDate).toISOString(),
        }
      : i
  )
}

/**
 * Omits specified properties from an object.
 *
 * @param {Record<string, any>} obj - The object to omit properties from.
 * @param {string[]} props - The list of property names to omit.
 * @returns {Record<string, any>} - A new object without the omitted properties.
 */
export const omit = (
  obj: Record<string, any>,
  props: string[]
): Record<string, any> => {
  return Object.keys(obj).reduce((result, key) => {
    if (!props.includes(key)) {
      result[key] = obj[key]
    }
    return result
  }, {} as Record<string, any>)
}

/**
 * Костиль, щоб прибрати `__v` з документу `mongodb` і далі порівнювати
 * отримані дані із тестовими
 * @param {any[]} data масив документів `mongo_object_response._doc`
 * @returns {any[]} масив документів без поля `__v`
 */
export const removeProps = (data: any[], props = ['__v', 'services']): any[] =>
  data.map((obj) => omit(obj, props))

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

// export const renderCurrency = (number: number): string =>
//   number ? new Intl.NumberFormat('en-EN').format(number) : '-'

export const renderCurrency = (number: any): string => {
  if (!isNaN(number)) {
    return new Intl.NumberFormat('en-US').format(
      Number(toRoundFixed(number.toString()))
    )
  } else {
    return '-'
  }
}

export const getFormattedDate = (data: Date, format = 'MMMM'): string => {
  if (data) {
    return toFirstUpperCase(moment(data).format(format))
  }
}

export const getPaymentProviderAndReciever = (company) => {
  const provider: IProvider = company && {
    description: company?.domain?.description || '',
  }
  const reciever: IReciever = company && {
    companyName: company?.companyName,
    adminEmails: company?.adminEmails,
    description: company?.description,
  }

  return { provider, reciever }
}

export const importedPaymentDateToISOStringDate = (date) => {
  return new Date(
    moment(date, 'DD.MM.YYYY', true).format('YYYY-MM-DD')
  ).toISOString()
}

/**
 * Parses string to float in x.xx format
 * @param value - string to be parsed into float
 * @param length - count of digits after comma
 * @returns float string on success or '0' on error
 */
export function toRoundFixed(value: string | number | any, length = 2): string {
  try {
    const num = Number(value.toString().replace(',', '.'))

    if (isNaN(num) || num === null) {
      throw new Error('NaN')
    }

    const multiplier = Number('1' + Array.from({ length }).fill('0').join(''))

    return (Math.round(num * multiplier) / multiplier).toString()
  } catch {
    return '0'
  }
}

export function multiplyFloat(a, b) {
  const bigA = Big(toRoundFixed(`${a}`))
  const bigB = Big(toRoundFixed(`${b}`))

  return +bigA.mul(bigB).round(2, Big.roundDown).toNumber()
}

export function plusFloat(a, b) {
  const bigA = Big(toRoundFixed(`${a}`))
  const bigB = Big(toRoundFixed(`${b}`))

  return +bigA.plus(bigB).round(2, Big.roundDown).toNumber()
}

export function filterOptions(options = {}, filterIds: any) {
  const res = {
    ...options,
  } as any
  const idsFromQueryFilter = (filterIds || '').split(',') || []
  if (res.$in) {
    res.$in = res.$in.filter((i) => idsFromQueryFilter.includes(i))
    return res
  }
  res.$in = idsFromQueryFilter
  return res
}

export async function getDistinctStreets({
  user,
  model,
}: {
  user: IUser
  model: mongoose.Model<any>
}): Promise<{ _id: mongoose.ObjectId; streetData: any }[] | undefined> {
  // TODO: group of user roles helpers maybe? Such as isGlobalAdmin(user: IUser): boolean
  const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)
  const domainsPipeline = getDomainsPipeline(isGlobalAdmin, user.email)
  const distinctDomains = await model.aggregate(domainsPipeline)
  const streetsPipeline = getStreetsPipeline(
    isGlobalAdmin,
    distinctDomains.map((domain) => domain._id)
  )
  return await model.aggregate(streetsPipeline)
}

export async function getDistinctCompanyAndDomain({
  isGlobalAdmin,
  user,
  companyGroup,
  model,
}) {
  const domainsPipeline = getDomainsPipeline(isGlobalAdmin, user.email)
  const distinctDomains = await model.aggregate(domainsPipeline)

  const distinctedDomainsIds = distinctDomains.map((domain) => domain._id)
  const realEstatesPipeline = getRealEstatesPipeline({
    isGlobalAdmin,
    distinctedDomainsIds,
    group: companyGroup,
  })
  const distinctCompanies = await model.aggregate(realEstatesPipeline)

  return { distinctDomains, distinctCompanies }
}

export const invoiceCoutWater = (waterPart, service) => {
  return waterPart && service
    ? ((waterPart / 100) * service?.waterPriceTotal).toFixed(2)
    : 0
}

export function convertToInvoicesObject(
  arr: { type: ServiceType; [key: string]: any }[]
): { [key: string]: { [key: string]: any } } {
  const result: { [key: string]: { [key: string]: any } } = {}

  for (const item of arr) {
    const { type, ...rest } = item
    let newObj: { [key: string]: any } = { ...rest }

    if (
      [
        ServiceType.Maintenance,
        ServiceType.Placing,
        ServiceType.GarbageCollector,
      ].includes(type)
    ) {
      newObj = {
        ...newObj,
        amount: rest.hasOwnProperty('amount') ? rest.amount : 0,
      }
    }

    if ([ServiceType.Electricity, ServiceType.Water].includes(type)) {
      newObj = {
        ...newObj,
        amount: rest.hasOwnProperty('amount') ? rest.amount : 0,
        lastAmount: rest.hasOwnProperty('lastAmount') ? rest.lastAmount : 0,
      }
    }

    newObj.price = item.hasOwnProperty('price') ? item.price : item.sum
    result[type] = newObj
  }

  return result
}

export function getRandomColor(): string {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

export function calculatePercentage(values: number[]): number[] {
  const totalArea = values.reduce((sum, element) => sum + element, 0)
  return values.map((element) => (element / totalArea) * 100)
}

export function generateColorsArray(length: number): string[] {
  let initialColors: string[] = [
    '#b4e4fc',
    '#e4fcb4',
    '#fcb4b4',
    '#fcd8b4',
    '#d8b4fc',
  ]
  if (length <= 5) {
    initialColors = initialColors.slice(0, length)
  } else {
    const additionalColors = Array.from({ length: length - 5 }, () =>
      getRandomColor()
    )
    initialColors = [...initialColors, ...additionalColors]
  }
  return initialColors
}

export function getFilterForAddress(streetDatas) {
  const filterData = streetDatas.map(({ streetData }) => ({
    text: `${streetData.address} (м. ${streetData.city})`,
    value: streetData._id,
  }))

  const uniqueTextsSet = new Set()

  const uniqueFilter = filterData.filter(({ text }) => {
    if (!uniqueTextsSet.has(text)) {
      uniqueTextsSet.add(text)
      return true
    }
    return false
  })

  return uniqueFilter
}

export function getFilterForDomain(domains) {
  const filterData = domains.map(({ domainDetails }) => ({
    text: domainDetails.name,
    value: domainDetails._id,
  }))

  return filterData
}

export function sortById(data: any) {
  return data?.sort((a: any, b: any) => a._id.localeCompare(b._id))
}

/**
 * Transforms the input into an array.
 *
 * @template T
 * @param {any} input The input to be transformed. Can be of any type.
 * @returns {T[]} An array containing the input elements. If input is already an array, it returns the input. If input is null or undefined, it returns an empty array.
 */
export function toArray<T = unknown>(input: any): T[] {
  if (input === undefined || input === null) {
    return []
  }

  if (Array.isArray(input)) {
    return input
  }

  return [input]
}

/**
 * Checks if the given value is empty.
 *
 * A value is considered empty if it is:
 * - `undefined`
 * - `null`
 * - an empty `array`
 * - an empty `string`
 * - an `object` with no own properties
 *
 * @template T The type of the value.
 * @param {T} value The value to check.
 * @returns {boolean} `true` if the value is empty, otherwise `false`.
 */
export const isEmpty = <T = unknown>(value: T): boolean => {
  return (
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'string' && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  )
}

/**
 * Checks if two values are deeply equal. Performs a deep comparison between two values to determine if they are equivalent.
 *
 * @param {any} a The first value to compare.
 * @param {any} b The second value to compare.
 * @returns {boolean} `true` if the values are deeply equal, otherwise `false`.
 */
export const isEqual = (a: any, b: any): boolean => {
  if (a === b) {
    return true
  }

  if (typeof a !== typeof b || a === null || b === null) {
    return false
  }

  if (typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) {
      return false
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false
      }
      return a.every((item, index) => isEqual(item, b[index]))
    }

    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) {
      return false
    }

    return keysA.every((key) => isEqual((a as any)[key], (b as any)[key]))
  }

  return false
}
