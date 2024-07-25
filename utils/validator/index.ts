import { isEmpty, isEqual } from '@utils/helpers'
import { FormRule } from 'antd'

export interface Validator {
  required: () => FormRule
  not: (value: number) => FormRule
  min: (min: number) => FormRule
  max: (max: number) => FormRule
  boundary: (min: number, max: number) => FormRule
}

const validator: Validator = {
  required: () => ({
    validator(_, value: any) {
      if (isEmpty(value)) {
        return Promise.reject(new Error("Поле обов'язкове!"))
      }

      return Promise.resolve()
    },
  }),
  not: (v) => ({
    validator(_, value: any) {
      if (isEqual(v, value)) {
        return Promise.reject(new Error(`Не рівне ${v}`))
      }

      return Promise.resolve()
    },
  }),
  min: (min) => ({
    validator(_, value: any) {
      if (
        (typeof value !== 'string' && typeof value !== 'number') ||
        isNaN(Number(value)) ||
        Number(value) < min
      ) {
        return Promise.reject(new Error(`Не менше ${min}`))
      }

      return Promise.resolve()
    },
  }),
  max: (max) => ({
    validator(_, value: any) {
      if (
        (typeof value !== 'string' && typeof value !== 'number') ||
        isNaN(Number(value)) ||
        Number(value) > max
      ) {
        return Promise.reject(new Error(`Не більше ${max}`))
      }

      return Promise.resolve()
    },
  }),
  boundary: (min, max) => ({
    validator(_, value: any) {
      if (
        (typeof value !== 'string' && typeof value !== 'number') ||
        isNaN(Number(value)) ||
        Number(value) > max ||
        Number(value) < min
      ) {
        return Promise.reject(new Error(`В межах від ${min} до ${max}`))
      }

      return Promise.resolve()
    },
  }),
}

export default validator
