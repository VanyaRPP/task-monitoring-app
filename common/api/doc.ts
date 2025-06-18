import path from 'path'
import { promises as fs } from 'fs'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const specPath = path.join(process.cwd(), 'public', 'swagger.json')
  const spec = JSON.parse(await fs.readFile(specPath, 'utf8'))
  res.status(200).json(spec)
}
