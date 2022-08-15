import { ICallback } from './../../modules/models/Callback'
export type { ICallback } from 'common/modules/models/Callback'

export interface AllCallbackQuery {
  success: boolean
  data: ICallback[]
}

export interface BaseQuery {
  success: boolean
  data: ICallback
}
