import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from 'utils/dbConnect'
import User from 'common/modules/models/User'

type Data = {
  data?: any
  success: boolean
  error?: any
}

async function start() {
  await dbConnect()
}
start()
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: The user name
 *         image:
 *           type: string
 *           description: The user image
 *         emailVerified:
 *           type: null
 *           description: not using
 *         role:
 *           type: string
 *           description: 'User/Worker/Admin'
 *       example:
 *         id: d5fE_aszd5fE_aszd5fE_asz
 *         name: Van
 *         image: https://example.png
 *         role: User
 */

/**
 * @swagger
 * tags:
 *   name: User
 *   description: The user managing API
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      /**
       * @swagger
       * /api/user/{email}:
       *   get:
       *     summary: Get the user by email
       *     tags: [User]
       *     parameters:
       *       - in: path
       *         name: email
       *         schema:
       *           type: string
       *         required: true
       *         description: The user email
       *     responses:
       *       201:
       *         description: The user description by email
       *         contens:
       *           application/json:
       *             schema:
       *               $ref: '#/components/schemas/User'
       *       404:
       *         description: The user was not found
       */
      try {
        const user = await User.findOne({ email: req.query.email })
        return res.status(201).json({ success: true, data: user })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'PATCH':
      /**
       * @swagger
       * /api/user/{email}:
       *  patch:
       *    summary: Update the user role by the email
       *    tags: [User]
       *    parameters:
       *      - in: path
       *        name: email
       *        schema:
       *          type: string
       *        required: true
       *        description: The user email
       *    requestBody:
       *      required: true
       *      content:
       *        application/json:
       *          schema:
       *            $ref: '#/components/schemas/User'
       *    responses:
       *      201:
       *        description: The user role was updated
       *        content:
       *          application/json:
       *            schema:
       *              $ref: '#/components/schemas/User'
       *      404:
       *        description: The book was not found
       *      500:
       *        description: Some error happened
       */
      try {
        let user
        if (req.body.tel) {
          user = await User.findOneAndUpdate(
            { email: req.query.email },
            {
              isWorker: true,
              tel: req.body.tel,
              role: 'Worker',
            }
          )
        } else {
          user = await User.findOneAndUpdate(
            { email: req.query.email },
            { role: req.query.role }
          )
        }
        return res.status(201).json({ success: true, data: user })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    // try {
    //   const maybeteam = await User.findOne({ name: req.body.name }).exec()
    //   console.log(req.body.name, '--------', maybeteam)
    //   let team
    //   !maybeteam ? team = await User.create(req.body) : team = await User.updateOne({ name: req.body.name }, { $set: { score: maybeteam.score + 1 } })
    //   return res.status(201).json({ success: true, data: team })
    // } catch (error) {
    //   return res.status(400).json({ success: false })
    // }
  }
}
