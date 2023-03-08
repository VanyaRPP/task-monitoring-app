/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import Favor from 'common/modules/models/Favor'
import start, { Data } from 'pages/api/api.config'
start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'DELETE':
      try {
        await Favor.findByIdAndRemove(req.query.id).then((favor) => {
          if (favor) {
            return res.status(200).json({
              success: true,
              data: 'Favor ' + req.query.id + ' was deleted',
            })
          } else {
            return res.status(400).json({
              success: false,
              data: 'Favor ' + req.query.id + ' was not found',
            })
          }
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
