import React from 'react'
import { Badge, Tooltip } from 'antd'
import type { IDebtorInflation } from '@common/api/debtorsApi/debtors.api.types'
import {
  formatDebtAmount,
  formatSignedDebt,
  getDebtorTooltipColor,
  getDebtSide,
} from '@utils/helpers'

const INFLATION_METHOD_LABEL = {
  balance: 'за залишком',
  monthly: 'помісячно',
} as const

export interface DebtBadgeProps {
  companyName: string
  totalDebt: number
  inflation?: IDebtorInflation | null
  /** Якщо передано, бадж обгортає children (сторінка компанії). Інакше малюється самостійний бадж. */
  children?: React.ReactNode
  offset?: [number, number]
}

const DebtBadge: React.FC<DebtBadgeProps> = ({
  companyName,
  totalDebt,
  inflation,
  children,
  offset,
}) => {
  const side = getDebtSide(totalDebt)

  if (!side) return <>{children ?? null}</>

  const isCompanyDebtor = side === 'company'

  const tooltipContent = (
    <div>
      <p>
        <b>{isCompanyDebtor ? 'Компанія боржник' : 'Переплата компанії'}</b>
      </p>
      <p>Назва компанії: {companyName}</p>
      <p>
        {isCompanyDebtor ? 'Сума боргу' : 'Сума переплати'}:{' '}
        {formatDebtAmount(totalDebt)}
      </p>
      {isCompanyDebtor && inflation && (
        <p>
          Інфляційні втрати: {formatDebtAmount(inflation.loss)}
          <br />
          <small>
            {inflation.from} – {inflation.to},{' '}
            {INFLATION_METHOD_LABEL[inflation.method]}
          </small>
        </p>
      )}
    </div>
  )

  return (
    <Tooltip title={tooltipContent} placement="top">
      <Badge
        count={formatSignedDebt(totalDebt)}
        title=""
        color={getDebtorTooltipColor({ totalDebt })}
        overflowCount={Infinity}
        style={{ cursor: 'pointer' }}
        size="small"
        offset={offset}
      >
        {children}
      </Badge>
    </Tooltip>
  )
}

export default DebtBadge
