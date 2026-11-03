import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { defaultDebtPeriod } from '@utils/debt-calculation/company-debt'
import { IYearMonth, parsePeriod } from '@utils/debt-calculation/months'
import { canEditDomain, canViewDomain } from '@utils/domain/domain-access'
import {
  getDomainIndexMonths,
  isValidIndexValue,
  resetDomainOverride,
  setDomainOverride,
} from '@utils/inflation-index/domain-overrides'
import { SERVICE_TIMEZONE } from '@utils/inflation-index/fill-services'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

const MAX_MONTHS = 120

const parseYearMonth = (year: unknown, month: unknown): IYearMonth | null => {
  const y = Number(year)
  const m = Number(month)

  return Number.isInteger(y) &&
    y >= 1900 &&
    y <= 2200 &&
    Number.isInteger(m) &&
    m >= 1 &&
    m <= 12
    ? { year: y, month: m }
    : null
}

const forbidden = (res: NextApiResponse<Data>) =>
  res.status(403).json({ success: false, message: 'Немає доступу' })

async function domainInflationHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const access = await getCurrentUser(req, res)
  const actor = {
    email: access.user?.email,
    id: access.user?._id ? String(access.user._id) : undefined,
  }

  switch (req.method) {
    case 'GET': {
      const domainId = String(req.query.domainId ?? '')
      if (!(await canViewDomain(access, domainId))) return forbidden(res)

      const fallback = defaultDebtPeriod(new Date(), SERVICE_TIMEZONE)
      const from = parsePeriod(req.query.from as string) ?? fallback.from
      const to = parsePeriod(req.query.to as string) ?? fallback.to
      const span = to.year * 12 + to.month - (from.year * 12 + from.month)
      if (span < 0 || span >= MAX_MONTHS) {
        return res
          .status(400)
          .json({ success: false, message: 'Некоректний період' })
      }

      const [months, canEdit] = await Promise.all([
        getDomainIndexMonths(domainId, from, to),
        canEditDomain(access, domainId),
      ])

      return res.status(200).json({ success: true, data: { canEdit, months } })
    }

    case 'PUT': {
      const { domainId, year, month, value } = req.body ?? {}
      if (!(await canEditDomain(access, domainId))) return forbidden(res)

      const period = parseYearMonth(year, month)
      if (!period) {
        return res
          .status(400)
          .json({ success: false, message: 'Некоректний місяць' })
      }
      if (!isValidIndexValue(value)) {
        return res.status(400).json({
          success: false,
          message: 'Індекс має бути числом від 90 до 120',
        })
      }

      await setDomainOverride(domainId, period, value, actor)

      return res.status(200).json({ success: true })
    }

    case 'DELETE': {
      const domainId = String(req.query.domainId ?? '')
      if (!(await canEditDomain(access, domainId))) return forbidden(res)

      const period = parseYearMonth(req.query.year, req.query.month)
      if (!period) {
        return res
          .status(400)
          .json({ success: false, message: 'Некоректний місяць' })
      }

      const removed = await resetDomainOverride(domainId, period, actor)
      if (!removed) {
        return res
          .status(404)
          .json({ success: false, message: 'Значення домену не задано' })
      }

      return res.status(200).json({ success: true })
    }

    default:
      return res
        .status(405)
        .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }
}

export default withErrorHandler(domainInflationHandler)
