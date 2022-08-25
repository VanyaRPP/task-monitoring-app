/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import start, { Data } from 'pages/api/api.config'
import { v4 as uuidv4 } from 'uuid'

start()

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'POST':
      try {
        const form = new formidable.IncomingForm()
        form.parse(req, async function (err, fields, files) {
          const id = await saveFile(files.file)
          return res.status(201).send({ success: true, data: { imageId: id } })
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}

const saveFile = async (file: any) => {
  const data = fs.readFileSync(file.filepath)
  const fileId = uuidv4()
  const fileType = file.mimetype.split('/')[1]
  fs.writeFileSync(`./static/${fileId}.${fileType}`, data)
  await fs.unlinkSync(file.filepath)
  return fileId
}
