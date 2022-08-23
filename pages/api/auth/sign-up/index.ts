import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcrypt'
import start, { Data } from 'pages/api/api.config'
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        User.findOne({
          email,
        }).then(() => new Error('Error: User is already exist!'))

        bcrypt.hash(password, saltRounds, async function (err, hash) {
          if (err) throw Error('Error: Encryption error!')
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
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
