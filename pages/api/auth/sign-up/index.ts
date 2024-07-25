/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import User from '@modules/models/User'
import start, { Data } from '@pages/api/api.config'
import { saltRounds } from '@utils/constants'
import bcrypt from 'bcrypt'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { name, email, password } = req.body
  switch (req.method) {
    case 'POST':
      try {
        const user = await User.findOne({ email })

        if (user) {
          return res
            .status(409)
            .json({ success: false, error: 'User already exists!' })
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
        return res.status(400).json({ success: false, error: error })
      }
  }
}
