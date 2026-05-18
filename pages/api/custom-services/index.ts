import {
  createCustomService,
  deleteCustomService,
  isServiceErr,
  ServiceErrorCode,
  ServiceResult,
  updateCustomService,
  UserContext,
} from '@common/services/customServiceService/customService.service'
import CustomService from '@modules/models/CustomService'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

const CODE_TO_STATUS: Record<ServiceErrorCode, number> = {
  invalid: 400,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
}

function respond<T>(
  res: NextApiResponse<Data>,
  result: ServiceResult<T>,
  successStatus: number
) {
  if (isServiceErr(result)) {
    return res
      .status(CODE_TO_STATUS[result.code])
      .json({ success: false, message: result.message })
  }
  return res.status(successStatus).json({ success: true, data: result.data })
}

function pickString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const ctx = (await getCurrentUser(req, res)) as UserContext

  switch (req.method) {
    case 'POST':
      try {
        return respond(
          res,
          await createCustomService(req.body, ctx),
          201
        )
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          message: 'Помилка при створенні сервісу',
          error: error.message,
        })
      }

    case 'PATCH':
      try {
        return respond(
          res,
          await updateCustomService(
            pickString(req.query.id),
            { ...req.body, domainId: pickString(req.query.domainId) },
            ctx
          ),
          200
        )
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          message: 'Помилка при оновленні сервісу',
          error: error.message,
        })
      }

    case 'DELETE':
      try {
        return respond(
          res,
          await deleteCustomService(
            pickString(req.query.id),
            { domainId: pickString(req.query.domainId) },
            ctx
          ),
          200
        )
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          message: 'Помилка при видаленні сервісу',
          error: error.message,
        })
      }

    case 'GET':
      try {
        const { _id, domainId: rawDomainId } = req.query

        if (ctx.isUser) {
          return res.status(400).json({
            success: false,
            message: 'Не дозволено',
          })
        }

        const filter: Record<string, unknown> = {}
        if (
          rawDomainId !== undefined &&
          rawDomainId !== null &&
          rawDomainId !== ''
        ) {
          const domainIdStr = Array.isArray(rawDomainId)
            ? String(rawDomainId[0])
            : String(rawDomainId)
          if (!mongoose.Types.ObjectId.isValid(domainIdStr)) {
            return res.status(400).json({
              success: false,
              message: 'Невалідний domainId',
            })
          }
          filter.$or = [
            { domain: new mongoose.Types.ObjectId(domainIdStr) },
            { domain: { $in: [null, undefined] } },
            { domain: { $exists: false } },
          ]
        }

        const hasExplicitIds = _id !== undefined && _id !== null && _id !== ''

        let customServices
        if (!hasExplicitIds) {
          customServices = await CustomService.find(filter).lean()
        } else {
          const rawIds: string[] = Array.isArray(_id)
            ? _id.flatMap((value) => String(value).split(','))
            : String(_id).split(',')
          const validIds = rawIds
            .map((id) => id.trim())
            .filter((id) => mongoose.Types.ObjectId.isValid(id))

          customServices = validIds.length
            ? await CustomService.find({
                ...filter,
                _id: { $in: validIds },
              }).lean()
            : []
        }

        return res.status(200).json({
          success: true,
          data: customServices,
        })
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          message: 'Помилка при отриманні сервісів',
          error: error.message,
        })
      }

    default:
      return res.status(405).json({
        success: false,
        message: `Метод ${req.method} не дозволений`,
      })
  }
}
