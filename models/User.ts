import mongoose, { Schema, Types, model } from 'mongoose';


interface IUser {
  name: string;
  email: string;
  image?: string;
  role?: string;
  // organization: Types.ObjectId;
}

const UserShema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  image: String,
  role: { type: String, default: 'User' },
  // organization: { type: Schema.Types.ObjectId, ref: 'Organization' }
})

module.exports = mongoose.models.Users || model('User', UserShema)
