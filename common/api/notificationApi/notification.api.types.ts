import { INotification } from '@modules/models/Notification'
export type { INotification } from '@modules/models/Notification'

export interface BaseQuery {
  success: boolean
  data: INotification[]
}
