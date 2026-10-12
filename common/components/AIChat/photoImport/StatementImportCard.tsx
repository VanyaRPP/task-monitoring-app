import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Alert, Button, Modal, Space, Table, Typography } from 'antd'
import {
  CheckCircleOutlined,
  FileSearchOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useImportDebtCalculationMutation } from '@common/api/debtCalculationApi/debtCalculation.api'
import {
  formatMoney,
  formatMonthLabel,
} from '@common/components/DebtCalculation/format'
import { announceDebtImport } from '@common/components/DebtCalculation/importEvents'
import { AppRoutes } from '@utils/constants'
import { formatPeriod } from '@utils/debt-calculation/months'
import {
  IStatementRow,
  toStatementImport,
} from '@utils/debt-calculation/statement'
import CompanyPicker from './CompanyPicker'
import type { IStatementGroup } from './grouping'
import type { IImportCardState } from './useDocumentImports'
import styles from '../style.module.scss'

const { Text } = Typography

/** More than this and the list drowns the card; the table shows the rest. */
const VISIBLE_ISSUES = 8

const plural = (count: number, one: string, few: string, many: string) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

const rowColumns = (flagged: Set<string>) => [
  {
    title: 'Місяць',
    key: 'period',
    render: (_: unknown, row: IStatementRow) => (
      <span>
        {flagged.has(formatPeriod(row)) && (
          <WarningOutlined className={styles.importFlag} />
        )}
        {formatMonthLabel(row.year, row.month)}
      </span>
    ),
  },
  { title: 'Вхідне', dataIndex: 'opening', render: formatMoney },
  { title: 'Коректура', dataIndex: 'correction', render: formatMoney },
  { title: 'Нарахування', dataIndex: 'charged', render: formatMoney },
  { title: 'Оплата', dataIndex: 'paid', render: formatMoney },
  { title: 'Вихідне', dataIndex: 'closing', render: formatMoney },
]

/**
 * One flat's statement read off photos. Its only action fills the company's
 * debt calculation: the table there is where the figures get checked and
 * fixed, and where payments are then created from them.
 */
const StatementImportCard: React.FC<{
  group: IStatementGroup
  card: IImportCardState
  onChange: (patch: Partial<IImportCardState>) => void
}> = ({ group, card, onChange }) => {
  const [tableOpen, setTableOpen] = useState(false)
  const [fill, { isLoading, error }] = useImportDebtCalculationMutation()

  const statement = useMemo(
    () => toStatementImport(group.rows, group.correctionSign),
    [group.rows, group.correctionSign]
  )
  const flagged = useMemo(
    () => new Set(group.issues.map(({ period }) => period).filter(Boolean)),
    [group.issues]
  )
  const problems = group.issues.filter(({ kind }) => kind !== 'autocorrected')
  const repairs = group.issues.filter(({ kind }) => kind === 'autocorrected')

  const first = group.rows[0]
  const last = group.rows[group.rows.length - 1]
  const target =
    card.companyId && card.domainId
      ? { domainId: card.domainId, companyId: card.companyId }
      : null

  const save = async () => {
    if (!target) return
    const response = await fill({
      ...target,
      rows: statement.months,
      ...(statement.openingBalance
        ? { openingDebt: statement.openingBalance.amount }
        : {}),
    })
    if ('data' in response) {
      announceDebtImport(target)
      onChange({ filled: { months: statement.months.length } })
    }
  }

  const listIssues = (issues: typeof group.issues) => (
    <ul>
      {issues.slice(0, VISIBLE_ISSUES).map((issue, index) => (
        <li key={index}>{issue.message}</li>
      ))}
      {issues.length > VISIBLE_ISSUES && (
        <li>…і ще {issues.length - VISIBLE_ISSUES}</li>
      )}
    </ul>
  )

  return (
    <div className={styles.importCard}>
      <Text strong>
        <FileSearchOutlined /> Борг по місяцях
      </Text>
      <div className={styles.importMeta}>
        {group.header.address && <div>{group.header.address}</div>}
        <div>
          {group.rows.length} міс.: {formatMonthLabel(first.year, first.month)}{' '}
          — {formatMonthLabel(last.year, last.month)}
          {group.photoNames.length > 1 &&
            ` (з ${group.photoNames.length} фото)`}
        </div>
        <div>
          Вхідне сальдо: <b>{formatMoney(first.opening ?? undefined)}</b>,
          вихідне: <b>{formatMoney(last.closing ?? undefined)}</b> грн
        </div>
      </div>

      {problems.length > 0 && (
        <Alert
          type="warning"
          showIcon
          className={styles.importIssues}
          message={`Перевірте ${problems.length} ${plural(problems.length, 'місце', 'місця', 'місць')} — у розрахунку їх можна виправити`}
          description={listIssues(problems)}
        />
      )}
      {repairs.length > 0 && (
        <Alert
          type="info"
          showIcon
          className={styles.importIssues}
          message={`Виправлено за сальдо: ${repairs.length}`}
          description={listIssues(repairs)}
        />
      )}

      <Button
        type="link"
        size="small"
        className={styles.importTableLink}
        onClick={() => setTableOpen(true)}
      >
        Переглянути таблицю
      </Button>

      {card.filled && target ? (
        <Space direction="vertical" size={4}>
          <Text type="success">
            <CheckCircleOutlined /> Розрахунок заповнено: {card.filled.months}{' '}
            {plural(card.filled.months, 'місяць', 'місяці', 'місяців')}
          </Text>
          <Link
            href={`${AppRoutes.DEBT_CALCULATION}?domainId=${target.domainId}&companyId=${target.companyId}`}
          >
            Відкрити розрахунок заборгованості
          </Link>
          <Text type="secondary" className={styles.importHint}>
            Перевірте місяці, позначені «з фото», і натисніть там «Створити
            платежі».
          </Text>
        </Space>
      ) : card.dismissed ? (
        <Text type="secondary">Імпорт скасовано.</Text>
      ) : (
        <>
          <Text type="secondary" className={styles.importHint}>
            {card.companyId
              ? 'Компанія:'
              : group.candidates.length > 1
                ? 'Кілька схожих компаній — оберіть потрібну:'
                : 'Компанію не знайдено автоматично — оберіть:'}
          </Text>
          <CompanyPicker
            candidates={group.candidates}
            value={card.companyId}
            onChange={({ id, domainId }) =>
              onChange({ companyId: id, domainId })
            }
            disabled={isLoading}
          />
          {error && (
            <Text type="danger" className={styles.importHint}>
              {(error as any)?.data?.message ?? 'Не вдалося заповнити'}
            </Text>
          )}
          <Space className={styles.importActions}>
            <Button
              type="primary"
              size="small"
              disabled={!target}
              loading={isLoading}
              onClick={save}
            >
              Заповнити розрахунок
            </Button>
            <Button
              size="small"
              disabled={isLoading}
              onClick={() => onChange({ dismissed: true })}
            >
              Скасувати
            </Button>
          </Space>
          <Text type="secondary" className={styles.importHint}>
            Місяці з фото замінять уже введені в розрахунку за ті самі місяці.
            Платежі поки не створюються.
          </Text>
        </>
      )}

      <Modal
        open={tableOpen}
        onCancel={() => setTableOpen(false)}
        footer={null}
        width={760}
        title={`Розпізнана таблиця${group.header.address ? ` — ${group.header.address}` : ''}`}
      >
        <Table
          size="small"
          pagination={false}
          scroll={{ y: 480 }}
          rowKey={(row) => formatPeriod(row)}
          rowClassName={(row) =>
            flagged.has(formatPeriod(row)) ? styles.importRowFlagged : ''
          }
          columns={rowColumns(flagged)}
          dataSource={group.rows}
        />
      </Modal>
    </div>
  )
}

export default StatementImportCard
