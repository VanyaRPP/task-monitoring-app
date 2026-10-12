import React, { useMemo, useState } from 'react'
import { Alert, Button, message, Modal, Spin, Typography } from 'antd'
import { DollarOutlined } from '@ant-design/icons'
import {
  useImportStatementMutation,
  usePlanStatementImportMutation,
} from '@common/api/paymentApi/payment.api'
import type { IStatementImport } from '@utils/debt-calculation/statement'
import {
  IStatementImportPlan,
  OPENING_RESOLUTION_KEY,
  Resolution,
  resolveStatementImport,
} from '@utils/debt-calculation/statement-plan'
import { useDebtCalculationContext } from './'
import { formatMoney, formatMonthLabel } from './format'
import s from './style.module.scss'

const round2 = (value: number): number => Math.round(value * 100) / 100

const plural = (count: number, one: string, few: string, many: string) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/**
 * Everything the table ends up with - for every month of the period its
 * charge, correction and payment (typed in, read off a photo, or already in
 * the DB), plus the opening debt as a «Вхідне сальдо» at the period start.
 */
export const tableStatement = (
  rows: {
    year: number
    month: number
    charged: number
    correction: number
    paid: number
  }[],
  openingDebt: number
): IStatementImport => ({
  openingBalance:
    rows.length > 0 && openingDebt !== 0
      ? {
          year: rows[0].year,
          month: rows[0].month,
          amount: round2(openingDebt),
        }
      : null,
  months: rows.map(({ year, month, charged, correction, paid }) => ({
    year,
    month,
    charged: round2(charged),
    correction: round2(correction),
    paid: round2(paid),
  })),
})

/**
 * The table's way of saying "overwrite": every month that differs and can be
 * replaced takes the table's figures, and so does a differing opening balance.
 */
export const overwriteAll = (
  plan: IStatementImportPlan
): Record<string, Resolution> => ({
  ...Object.fromEntries(
    plan.months
      .filter(({ status, replaceable }) => status === 'conflict' && replaceable)
      .map(({ period }) => [period, 'import' as Resolution])
  ),
  ...(plan.opening?.status === 'conflict'
    ? { [OPENING_RESOLUTION_KEY]: 'import' as Resolution }
    : {}),
})

/**
 * «Створити платежі»: turns the calculation into the company's payments.
 *
 * The table is the source of truth here - the user has checked it against
 * the paper. So months the system already holds differently are overwritten
 * (their records are replaced; the audit log keeps them restorable), matching
 * months are left alone, and months that also carry other services' invoices
 * are skipped rather than lose those. The dialog shows all of it before
 * anything is written.
 */
const CreatePayments: React.FC = () => {
  const {
    domainId,
    companyId,
    company,
    result,
    openingDebt,
    refetchPayments,
    clearTypedFigures,
  } = useDebtCalculationContext()
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState<IStatementImportPlan | null>(null)
  const [planImport, { isLoading: isPlanning, error: planError }] =
    usePlanStatementImportMutation()
  const [importStatement, { isLoading: isImporting, error: importError }] =
    useImportStatementMutation()

  const statement = useMemo(
    () => (result ? tableStatement(result.rows, openingDebt) : null),
    [result, openingDebt]
  )
  const target = domainId && companyId ? { domainId, companyId } : null

  const start = async () => {
    if (!target || !statement) return
    setPlan(null)
    setOpen(true)
    const response = await planImport({ ...target, statement })
    if ('data' in response) setPlan(response.data)
  }

  const resolutions = plan ? overwriteAll(plan) : {}
  const resolved =
    plan && statement
      ? resolveStatementImport(statement, plan, resolutions)
      : null
  const replaced =
    plan?.months.filter(
      ({ status, replaceable }) => status === 'conflict' && replaceable
    ) ?? []
  const locked =
    plan?.months.filter(
      ({ status, replaceable }) => status === 'conflict' && !replaceable
    ) ?? []
  const counts = resolved && {
    newMonths: plan.months.filter(({ status }) => status === 'new').length,
    same: plan.months.filter(({ status }) => status === 'same').length,
    debits: resolved.months.filter(
      ({ charged, correction }) => charged !== 0 || correction !== 0
    ).length,
    credits: resolved.months.filter(({ paid }) => paid !== 0).length,
  }

  const create = async () => {
    if (!target || !statement || !plan) return
    const response = await importStatement({
      ...target,
      statement,
      resolutions,
      source: company?.companyName,
    })
    if (!('data' in response)) return

    const { result: created, plan: applied } = response.data
    // Months now backed by payments read their figures from the DB again.
    const done = applied.months
      .filter(({ status, replaceable }) => status !== 'conflict' || replaceable)
      .map(({ period }) => period)
    const openingDone =
      applied.opening?.status === 'new' ||
      applied.opening?.status === 'same' ||
      applied.opening?.status === 'conflict'
    clearTypedFigures(done, openingDone)
    refetchPayments()

    message.success(
      `Створено: ${created.created.debits} ${plural(created.created.debits, 'інвойс', 'інвойси', 'інвойсів')}, ` +
        `${created.created.credits} ${plural(created.created.credits, 'оплата', 'оплати', 'оплат')}` +
        (created.created.opening ? ', вхідне сальдо' : '') +
        (created.deletedIds.length
          ? `; перезаписано записів: ${created.deletedIds.length}`
          : '')
    )
    setOpen(false)
  }

  const errorText = (error: unknown, fallback: string) =>
    (error as any)?.data?.message ?? fallback

  return (
    <>
      <Button
        icon={<DollarOutlined />}
        disabled={!target || !result?.rows.length}
        onClick={start}
      >
        Створити платежі
      </Button>

      <Modal
        open={open}
        title="Створити платежі за розрахунком"
        okText="Створити платежі"
        cancelText="Скасувати"
        onOk={create}
        onCancel={() => setOpen(false)}
        okButtonProps={{ disabled: !plan, loading: isImporting }}
        width={620}
      >
        {isPlanning && (
          <div className={s.PlanLoading}>
            <Spin size="small" /> Звіряю таблицю з платежами компанії…
          </div>
        )}
        {planError && (
          <Alert
            type="error"
            showIcon
            message={errorText(planError, 'Не вдалося звірити з платежами')}
          />
        )}

        {plan && counts && (
          <div className={s.Plan}>
            <Typography.Paragraph>
              Буде створено: <b>{counts.debits}</b>{' '}
              {plural(counts.debits, 'інвойс', 'інвойси', 'інвойсів')}{' '}
              «Квартплата», <b>{counts.credits}</b>{' '}
              {plural(counts.credits, 'оплату', 'оплати', 'оплат')}
              {resolved.createOpening && ', вхідне сальдо'}.
            </Typography.Paragraph>
            <ul>
              <li>Нових місяців: {counts.newMonths}</li>
              <li>Вже є в платежах і збігаються — без змін: {counts.same}</li>
              {plan.opening && (
                <li>
                  Вхідне сальдо {formatMoney(plan.opening.amount)} грн:{' '}
                  {plan.opening.status === 'new'
                    ? 'буде створено'
                    : plan.opening.status === 'same'
                      ? 'вже є'
                      : plan.opening.status === 'covered'
                        ? 'не потрібне — історія платежів починається раніше'
                        : `замінить наявне (${formatMoney(plan.opening.system ?? 0)})`}
                </li>
              )}
            </ul>

            {replaced.length > 0 && (
              <Alert
                type="warning"
                showIcon
                message={`Буде перезаписано місяців: ${replaced.length} — наявні платежі за них замінять цифри з таблиці`}
                description={
                  <ul className={s.PlanList}>
                    {replaced.map((month) => (
                      <li key={month.period}>
                        {formatMonthLabel(month.year, month.month)}: було{' '}
                        {formatMoney(month.system?.charged)} /{' '}
                        {formatMoney(month.system?.paid)} → стане{' '}
                        {formatMoney(month.incoming.charged)} /{' '}
                        {formatMoney(month.incoming.paid)}
                      </li>
                    ))}
                  </ul>
                }
              />
            )}
            {locked.length > 0 && (
              <Alert
                type="info"
                showIcon
                message={`Пропущено місяців: ${locked.length} — у них є інвойси інших послуг, їх не видаляю`}
                description={locked
                  .map((month) => formatMonthLabel(month.year, month.month))
                  .join(', ')}
              />
            )}
            {plan.warnings.map((warning, index) => (
              <Alert key={index} type="warning" showIcon message={warning} />
            ))}
            <Typography.Paragraph type="secondary" className={s.PlanHint}>
              Нарахування / оплата за місяць. Листи мешканцям не надсилаються;
              усе, що створено й замінено, пишеться в журнал змін платежів
              однією партією — звідти замінене можна відновити.
            </Typography.Paragraph>
          </div>
        )}

        {importError && (
          <Alert
            type="error"
            showIcon
            message={errorText(importError, 'Не вдалося створити платежі')}
          />
        )}
      </Modal>
    </>
  )
}

export default CreatePayments
