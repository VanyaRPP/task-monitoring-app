import {
  createCustomService,
  deleteCustomService,
  isServiceErr,
  listCustomServicesForDomain,
  ServiceErrorCode,
  ServiceResult,
  updateCustomService,
  UserContext,
} from '@common/services/customServiceService/customService.service'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
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
        return respond(res, await createCustomService(req.body, ctx), 201)
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
        return respond(
          res,
          await listCustomServicesForDomain(
            {
              domainId: req.query.domainId,
              ids: req.query._id,
              templateCategory: req.query.templateCategory,
            },
            ctx
          ),
          200
        )
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
