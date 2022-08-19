import { INotification } from 'common/modules/models/Notification'
export type { INotification } from 'common/modules/models/Notification'

export interface BaseQuery {
  success: boolean
  data: INotification
}
