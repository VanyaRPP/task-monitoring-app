import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport(
  {
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT) || 3000,
    secure: true,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  },
  { from: process.env.EMAIL_FROM }
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET': {
      return res.status(200).json({ success: true, data: '' })
    }
    case 'POST': {
      try {
        const info = await transporter.sendMail(req.body)

        return res.status(201).json({ success: false, data: info })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    }
  }
}
