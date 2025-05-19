import mongoose from 'mongoose'

 const FeatureFlashSchema = new mongoose.Schema({
	name: {type: String, required: true, uniqe: true},
	description: String,
	isEnebled: {type: Boolean, deeafult: false},
	createdAt: {type: Date, default: Date.now}
 })

export default mongoose.models.FeatureFlag || mongoose.model('FeatureFlag', FeatureFlashSchema);