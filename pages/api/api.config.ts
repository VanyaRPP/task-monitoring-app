import dbConnect from 'utils/dbConnect'

export type Data = {
  data?: any
  success: boolean
  error?: any
  message?: string
}

const start = async () => {
  await dbConnect()
}

export default start
