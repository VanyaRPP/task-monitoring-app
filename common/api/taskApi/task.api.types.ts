import { ObjectId } from 'mongoose'
import { ITask } from 'common/modules/models/Task'
export type { ITask } from 'common/modules/models/Task'

export interface IAcceptQuery {
  taskId: ObjectId | string
  workerId: ObjectId | string
}

export interface IDeleteQuery {
  userId: number | string
  itemId: number | string
}

export interface AllTasksQuery {
  success: boolean
  data: ITask[]
}

export interface TaskQuery {
  success: boolean
  data: ITask
}
