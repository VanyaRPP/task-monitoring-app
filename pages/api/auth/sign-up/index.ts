import User from '@modules/models/User'
import start, { Data } from '@pages/api/api.config'
import { saltRounds } from '@utils/constants'
import { isValidEmail } from '@common/assets/features/validators'
import bcrypt from 'bcrypt'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  const { name, email, password } = req.body as {
    name?: string
    email?: string
    password?: string
  }

  try {
    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid email address' })
    }

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: 'Password is required' })
    }

    const user = await User.findOne({ email })

    if (user) {
      return res
        .status(409)
        .json({ success: false, message: 'User already exists!' })
    }

    bcrypt.hash(password, saltRounds, async function (err, hash) {
      if (err) throw Error('Error: Encryption error!')
      await User.create({
        name,
        email,
        password: hash,
      })
    })

    return res.status(201).json({ success: true })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: (error as Error)?.message ?? 'Sign-up failed',
    })
  }
}
