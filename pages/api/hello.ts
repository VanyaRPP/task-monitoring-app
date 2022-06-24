import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  data?: any,
  success: boolean,
  error?: any,
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({ success: true })
}
