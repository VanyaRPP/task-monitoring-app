import { isEmpty, isEqual } from '@utils/helpers'
import { FormRule } from 'antd'

export interface Validator {
  required: () => FormRule
  not: (value: number) => FormRule
  min: (min: number) => FormRule
  max: (max: number) => FormRule
  boundary: (min: number, max: number) => FormRule
}

export const getValidator = (t: (key: string, options?: any) => string): Validator => ({
  required: () => ({
    validator(_, value: any) {
      if (isEmpty(value)) {
        return Promise.reject(new Error(t('validation.required')))
      }
      return Promise.resolve()
    },
  }),

  not: (v) => ({
    validator(_, value: any) {
      if (isEqual(v, value)) {
        return Promise.reject(new Error(t('validation.notEqual', { value: v })))
      }
      return Promise.resolve()
    },
  }),

  min: (min) => ({
    validator(_, value: any) {
      if (isNaN(Number(value)) || Number(value) < min) {
        return Promise.reject(new Error(t('validation.min', { min })))
      }
      return Promise.resolve()
    },
  }),

  max: (max) => ({
    validator(_, value: any) {
      if (isNaN(Number(value)) || Number(value) > max) {
        return Promise.reject(new Error(t('validation.max', { max })))
      }
      return Promise.resolve()
    },
  }),

  boundary: (min, max) => ({
    validator(_, value: any) {
      if (
        isNaN(Number(value)) ||
        Number(value) < min ||
        Number(value) > max
      ) {
        return Promise.reject(new Error(t('validation.boundary', { min, max })))
      }
      return Promise.resolve()
    },
  }),
})

const validator = getValidator((key: string) => key)

export default validator
