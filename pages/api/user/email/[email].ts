import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from 'pages/api/api.config'
import User from 'common/modules/models/User'
import { Roles } from '@utils/constants'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        const user = await User.findOne({ email: req.query.email })

        return res.status(200).json({
          success: true,
          data: { email: user.email, name: user.name, image: user.image },
        })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'PATCH':
      try {
        let user
        if (req.body.tel) {
          user = await User.findOneAndUpdate(
            { email: req.query.email },
            {
              isWorker: true,
              tel: req.body.tel,
              role: 'Worker',
              address: req.body.address,
            }
          )
        } else {
          user = await User.findOneAndUpdate(
            { email: req.query.email, role: Roles.ADMIN },
            { role: req.query.role }
          )
        }
        return res.status(200).json({ success: true, data: user })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
  }
}
