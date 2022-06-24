import { ITask } from './Task';
import mongoose, { Schema, Types, model } from 'mongoose';


export interface IUser {
  name: string;
  email: string;
  image?: string;
  role?: string;
  tasks?: [ITask]
  // organization: Types.ObjectId;
}

const UserShema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  image: String,
  role: { type: String, default: 'User' },
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }]
})

const User = mongoose.models.User || mongoose.model("User", UserShema);
export default User;
// module.exports = mongoose.models.User || mongoose.model("User", UserShema);