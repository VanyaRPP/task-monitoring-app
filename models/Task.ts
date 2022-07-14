import mongoose, { Schema, ObjectId } from 'mongoose'

export interface ITask {
  _id?: ObjectId
  name: string
  creator?: ObjectId | string
  desription?: string
  domain: string
  category: string
  dateofcreate: Date
  deadline: string
}

export interface ICreateTask {
  name: string
  creator: ObjectId | string
  desription?: string
  address: IAddress
  category: string
  dateofcreate: Date
  deadline: string
}

export interface IAddress {
  name: string
  geoCode: IGeoCode
}

export interface IGeoCode {
  lat: number
  lng: number
}

interface ITaskModel {
  _id?: ObjectId
  name: string
  creator: ObjectId | string
  domain: string
  desription?: string
  address: IAddress
  category: string
  dateofcreate: Date
  deadline: string
}

const TaskShema = new Schema<ITaskModel>({
  name: { type: String, required: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User' },
  desription: { type: String, default: 'no description' },
  address: { type: Object, required: true },
  domain: { type: String },
  category: { type: String },
  dateofcreate: { type: Date, required: true, default: Date.now },
  deadline: { type: String, required: true },
})

const Task = mongoose.models.Task || mongoose.model('Task', TaskShema)
export default Task
