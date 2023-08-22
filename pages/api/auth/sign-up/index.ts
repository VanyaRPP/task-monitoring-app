/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcrypt'
import start, { Data } from '@pages/api/api.config'
import User from '@common/modules/models/User'
import { saltRounds } from '@utils/constants'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'POST':
      try {
        const { name, email, password } = req.body
        User.findOne({
          email,
        }).then((user) => {
          if (user) {
            return res.status(409).json({ success: false, error: 'User already exists!' })
          }
          else {
            return res.status(201).json({ success: true })
          }
        })

        bcrypt.hash(password, saltRounds, async function (err, hash) {
          if (err) throw Error('Error: Encryption error!')
          await User.create({
            name,
            email,
            password: hash,
          })
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
