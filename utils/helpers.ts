import User from '@common/modules/models/User'
import { FormInstance } from 'antd'
import { ObjectId } from 'mongoose'
import { Roles, ServiceType } from './constants'
import { PaymentOptions } from './types'
import moment from 'moment'
import 'moment/locale/uk'
import _omit from 'lodash/omit'
import { IProvider, IReciever } from '@common/api/paymentApi/payment.api.types'
import Big from 'big.js'
import { getDomainsPipeline, getRealEstatesPipeline } from './pipelines'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'


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
 * Костиль, щоб прибрати `__v` з документу `mongodb` і далі порівнювати
 * отримані дані із тестовими
 * @param {any[]} data масив документів `mongo_object_response._doc`
 * @returns {any[]} масив документів без поля `__v`
 */
export const removeProps = (data: any[], props = ['__v', 'services']): any[] =>
  data.map((obj) => _omit(obj, props))

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
 * Переводить номер місяця в його назву на українській і з великої літери
 * @param {number} index порядковий номер місяця
 * @returns форматований місяць
 */
export const NumberToFormattedMonth = (index?: number): string => {
  const month = moment().month(index).locale('uk').format('MMMM')
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

export const renderCurrency = (number: number): string =>
  number ? new Intl.NumberFormat('en-EN').format(number) : '-'

export const getFormattedDate = (data: Date): string => {
  if (data) {
    return firstTextToUpperCase(moment(data).format('MMMM'))
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

export function parseStringToFloat(stringWithComma) {
  // TODO: check for input string. is it ok
  // cover by tests
  const stringWithoutComma = ((stringWithComma || 0) + '').replace(',', '.')
  return +stringWithoutComma
    ? parseFloat(stringWithoutComma).toFixed(2)
    : '0.00'
}

export function multiplyFloat(a, b) {
  const bigA = Big(parseStringToFloat(`${a}`));
  const bigB = Big(parseStringToFloat(`${b}`));

  return +bigA.mul(bigB).round(2, Big.roundDown).toNumber();
}

export function plusFloat(a, b) {
  const bigA = Big(parseStringToFloat(`${a}`));
  const bigB = Big(parseStringToFloat(`${b}`));

  return +bigA.plus(bigB).round(2, Big.roundDown).toNumber();
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

export async function getDistinctCompanyAndDomain({ isGlobalAdmin, user, companyGroup, model }) {
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
  return (waterPart && service ? ((waterPart / 100) * service?.waterPriceTotal).toFixed(2) : 0);
}

export function convertToInvoicesObject(arr: { type: ServiceType, [key: string]: any }[]): { [key: string]: { [key: string]: any } } {
  const result: { [key: string]: { [key: string]: any } } = {};

  for (const item of arr) {
    const { type, ...rest } = item;
    let newObj: { [key: string]: any } = { ...rest };

    if ([ServiceType.Maintenance, ServiceType.Placing, ServiceType.GarbageCollector].includes(type)) {
      newObj = {
        ...newObj,
        amount: rest.hasOwnProperty('amount') ? rest.amount : 0,
      };
    }

    if ([ServiceType.Electricity, ServiceType.Water].includes(type)) {
      newObj = {
        ...newObj,
        amount: rest.hasOwnProperty('amount') ? rest.amount : 0,
        lastAmount: rest.hasOwnProperty('lastAmount') ? rest.lastAmount : 0,
      };
    }

    newObj.price = item.hasOwnProperty('price') ? item.price : item.sum;
    result[type] = newObj;
  }

  return result;
}
