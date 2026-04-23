import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import GroupedPricesTable from '@components/Forms/GroupedReceiptForm/GroupedPricesTable'
import { usePaymentContext } from '@components/AddPaymentModal'
import { getCurrencyShortLabel, normalizeCurrency } from '@utils/helpers'
import dayjs from 'dayjs'
import { FC, useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { PrinterOutlined, EditOutlined } from '@ant-design/icons'
import { Dropdown, Tooltip, message } from 'antd'
import s from './style.module.scss'
import cs from './templates/style.module.scss'

interface Props {
  currPayment?: IExtendedPayment | null
  paymentData?: IExtendedPayment | null | undefined
  paymentActions: { preview: boolean; edit: boolean }
}

const GroupedReceiptForm: FC<Props> = ({
  currPayment,
  paymentData,
  paymentActions: _paymentActions,
}) => {
  const { template, setTemplate } = usePaymentContext();
  const [topInfoCardHeight, setTopInfoCardHeight] = useState<number>(0)
  const { company } = usePaymentContext()
  const rawData = currPayment ?? paymentData ?? null
  const data = rawData as any
  const currency =
    data?.currency || data?.company?.currency || company?.currency || data?.domain?.currency
  const currencyLabel = getCurrencyShortLabel(currency)
  const isEnglish = normalizeCurrency(currency) !== 'UAH'
  const invoiceDatePrefix = dayjs(data?.invoiceCreationDate).isValid()
    ? dayjs(data?.invoiceCreationDate).format('DDMMYY')
    : ''
  const modernInvoiceNumber = `${invoiceDatePrefix}${data?.invoiceNumber || ''}`
  const domainName =
    data?.domain?.name ||
    (typeof company?.domain === 'object' ? company?.domain?.name : '')
  const rows = (data?.invoice || []).filter((item: any) => Number(item?.sum) !== 0)

  const getQty = (item: any) => {
    if (Number.isFinite(Number(item?.amount))) {
      if (Number.isFinite(Number(item?.lastAmount))) {
        return Number(item.amount) - Number(item.lastAmount)
      }
      return Number(item.amount)
    }
    return 1
  }

  const subtotal = rows.reduce(
    (acc: number, item: any) => acc + Number(item?.sum || 0),
    0
  )
  const taxPercent = 0
  const taxAmount = 0
  const total = subtotal + taxAmount

  const domainDescription =
    data?.domain?.description ||
    (typeof company?.domain === 'object' ? company?.domain?.description : '')

  const issuedToLines = [...(domainDescription?.trim()?.split('\n') || [])].filter(
    Boolean
  )

  const receiverDescriptionLines = (
    data?.reciever?.description?.split('\n') || []
  )
    .map((line: string) => line?.trim())
    .filter(Boolean)

  const bankDetailsTriggerRegex =
    /(account details|usd account details|iban|swift|bic|bank name|bank address|bank name and address|рахунок|банк|мфо)/i

  const paymentInfoDescriptionLines: string[] = []
  const bankDetailsLines: string[] = []
  let isBankSection = false

  receiverDescriptionLines.forEach((line: string) => {
    if (bankDetailsTriggerRegex.test(line)) {
      isBankSection = true
    }

    if (isBankSection) {
      bankDetailsLines.push(line)
    } else {
      paymentInfoDescriptionLines.push(line)
    }
  })

  const bankAddressLabelRegex =
    /^(bank name and address|bank name|bank address|назва банку|адреса банку)\s*:/i

  const normalizedBankDetailsLines = bankDetailsLines.reduce(
    (acc: string[], line: string) => {
      const normalizedLine = line?.trim()
      if (!normalizedLine) {
        return acc
      }

      const lastLine = acc[acc.length - 1] || ''
      const shouldAppendToPrevious =
        !!lastLine &&
        bankAddressLabelRegex.test(lastLine) &&
        !normalizedLine.includes(':')

      if (shouldAppendToPrevious) {
        acc[acc.length - 1] = `${lastLine} ${normalizedLine}`.trim()
      } else {
        acc.push(normalizedLine)
      }

      return acc
    },
    []
  )

  const entrepreneurTitleRegex =
    /^(private entrepreneur|private enterprise|fop|фоп|фізична особа\s*-?\s*підприємець)$/i

  const normalizedCompanyName = (data?.reciever?.companyName || '').trim()
  const firstPaymentInfoLine = (paymentInfoDescriptionLines?.[0] || '').trim()
  const hasEntrepreneurTitle = entrepreneurTitleRegex.test(firstPaymentInfoLine)

  const companyDisplayName = hasEntrepreneurTitle
    ? `${firstPaymentInfoLine} ${normalizedCompanyName}`.trim()
    : normalizedCompanyName

  const paymentInfoBodyLines = hasEntrepreneurTitle
    ? paymentInfoDescriptionLines.slice(1)
    : paymentInfoDescriptionLines

  const paymentInfoLines = [
    companyDisplayName,
    ...paymentInfoBodyLines,
    ...(data?.reciever?.adminEmails || []),
  ].filter(Boolean)

  const renderBankDetailsLine = (line: string) => {
    const trimmedLine = line?.trim?.() || ''
    const separatorIndex = trimmedLine.indexOf(':')

    const renderWithBoldUsd = (value: string) =>
      value.split(/(USD)/gi).map((chunk, idx) =>
        chunk.toUpperCase() === 'USD' ? (
          <span className={s.bankDetailsLabel} key={`usd-${idx}`}>
            {chunk}
          </span>
        ) : (
          chunk
        )
      )

    if (separatorIndex < 0) {
      return renderWithBoldUsd(trimmedLine)
    }

    const label = trimmedLine.slice(0, separatorIndex + 1)
    const value = trimmedLine.slice(separatorIndex + 1).trim()

    return (
      <>
        <span className={s.bankDetailsLabel}>{renderWithBoldUsd(label)}</span>
        {value ? <> {renderWithBoldUsd(value)}</> : ''}
      </>
    )
  }

  const componentRef = useRef<HTMLDivElement | null>(null)
  const paymentInfoCardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!paymentInfoCardRef.current) {
      return
    }

    const updateHeight = () => {
      const nextHeight = Math.ceil(
        paymentInfoCardRef.current?.getBoundingClientRect().height || 0
      )
      setTopInfoCardHeight(nextHeight)
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(paymentInfoCardRef.current)

    return () => observer.disconnect()
  }, [paymentInfoLines.length, isEnglish, template])

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle:
      (data?.company?.companyName ?? data?.reciever?.companyName ?? '') +
        '-inv-' +
        (data?.invoiceNumber ?? '') || 'invoice',
  })
  if (!rawData) {
    return null
  }

  const templateItems = [
    {
      key: 'classic',
      label: 'Класичний шаблон',
    },
    {
      key: 'olimp',
      label: 'OLIMP DIGITAL OÜ',
    },
  ]

  const handleSendToTelegram = async () => {
  const hide = message.loading('Генерація та відправка PDF...', 0);
  
  try {
    const response = await fetch('/api/telegram/send-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentData: data }), 
    });

    if (response.ok) {
      message.success('Готово! Інвойс уже в Telegram.');
    } else {
      throw new Error('Помилка сервера при генерації PDF');
    }
  } catch (err: any) {
    message.error(err.message);
  } finally {
    hide();
  }
};

  return (
    <>
      <PrinterOutlined className={s.print} onClick={handlePrint} />
      <Dropdown
        trigger={['click']}
        menu={{
          items: templateItems,
          onClick: ({ key }) => setTemplate(key as 'classic' | 'olimp'),
        }}
      >
        <Tooltip title={isEnglish ? 'Select template' : 'Обрати шаблон'}>
          <EditOutlined className={s.edit} />
        </Tooltip>
      </Dropdown>

      {template === 'classic' ? (
        <div
          className={cs.invoiceContainer}
          ref={componentRef}
          style={{
            width: '100%',
            height: '100%',
            marginTop: '2em',
            marginRight: '1.5em',
            marginLeft: '1.5em',
          }}
        >
          <div className={cs.providerInfo}>
            <div className={cs.label}>{isEnglish ? 'Provider' : 'Постачальник'}</div>
            <pre className={cs.preLabel}>
              {data?.provider?.description?.trim()} <br />
              <br />
            </pre>
          </div>

          <div className={cs.receiverInfo}>
            <div className={cs.label}>{isEnglish ? 'Recipient' : 'Одержувач'}</div>
            <pre className={cs.preLabel}>
              {data?.reciever?.description?.trim()} <br />
              {data?.reciever?.companyName} <br />
              {data?.reciever?.adminEmails?.map((email: string) => (
                <div key={email}>
                  {email} <br />
                </div>
              ))}
            </pre>
          </div>

          <div className={cs.providerInvoice}>
            <div className={cs.datecellTitle}>
              {isEnglish ? 'INVOICE №' : 'РАХУНОК №'} {data.invoiceNumber}
            </div>
            <div className={cs.datecellDate}>
              {isEnglish ? 'dated' : 'Від'} &nbsp;
              {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
              {isEnglish ? '.' : ' року.'}
            </div>
            <div className={cs.datecell}>
              {isEnglish ? 'Due by' : 'Підлягає сплаті до'} &nbsp;
              {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
              {!isEnglish && (
                <>
                  &nbsp; року
                </>
              )}
            </div>
          </div>

          <div className={cs.tableSum}>
            <GroupedPricesTable
              preview
              domainId={data?.domain?._id ?? data?.domain}
              currency={currency}
              invoices={data?.invoice ?? []}
            />
          </div>

          <div className={cs.payTable}>
            <div className={cs.payFixed}>
              {isEnglish ? 'Total payment amount:' : 'Загальна сума оплати:'}
              <div className={cs.payBoldSum}>
                {(+data?.generalSum || +data?.debit || 0).toFixed(2)}{' '}
                {currencyLabel}
              </div>
            </div>

            <div>
              {isEnglish ? 'Payment purpose:' : 'Призначення платежу:'}{' '}
              <strong>
                {isEnglish
                  ? `Payment for services according to invoice № ${data.invoiceNumber} dated ${dayjs(
                      data?.invoiceCreationDate
                    )?.format?.('DD.MM.YYYY')}`
                  : `Оплата за послуги згідно рахунку № ${data.invoiceNumber} від ${dayjs(
                      data?.invoiceCreationDate
                    )?.format?.('DD.MM.YYYY')}`}
              </strong>
            </div>

            <div className={cs.payFixed}>
              {data?.provider?.description?.split('\n')?.[0] || ''}
              <div className={cs.lineInner}>________________</div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={s.invoiceContainer}
          ref={componentRef}
          style={{
            width: '100%',
            maxWidth: '980px',
            margin: '2em auto 1em',
          }}
        >
          <div className={s.invoiceHeader}>
            <div className={s.brandBlock}>
              {/* <div className={s.brandLogo}>
                <img src="/icons/icon-96x96.png" alt="SpaceHub" />
              </div> */}
              <div className={s.brandText}>
                <div>{data?.reciever?.companyName || ''}</div>
              </div>
            </div>
            <h1>{isEnglish ? 'INVOICE' : 'РАХУНОК'} №{modernInvoiceNumber}</h1>
          </div>

          <div className={s.invoiceInfoCard}>
            <div className={s.infoColumnStack}>
              <div
                ref={paymentInfoCardRef}
                className={`${s.infoColumn} ${s.infoCard} ${s.topInfoCard}`}
              >
                <h4>{isEnglish ? 'PAYMENT INFO:' : 'ПЛАТІЖНІ ДАНІ:'}</h4>
                <div className={s.infoList}>
                  {paymentInfoLines.map((line: string, idx: number) => (
                    <div
                      className={`${s.infoLine} ${idx === 0 ? s.infoLineAccent : ''}`}
                      key={`${line}-${idx}`}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {!!normalizedBankDetailsLines.length && (
                <div className={`${s.infoColumn} ${s.infoCard} ${s.bankDetailsCard}`}>
                  <div className={s.infoList}>
                    {normalizedBankDetailsLines.map((line: string, idx: number) => (
                      <div
                        className={s.infoLine}
                        key={`${line}-${idx}`}
                      >
                        {renderBankDetailsLine(line)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              className={`${s.infoColumn} ${s.infoCard} ${s.topInfoCard} ${s.issuedToCard}`}
              style={
                topInfoCardHeight > 0 ? { height: `${topInfoCardHeight}px` } : undefined
              }
            >
              <h4>{isEnglish ? 'ISSUED TO:' : 'ОТРИМУВАЧ:'}</h4>
              <div className={s.infoList}>
                {issuedToLines.map((line: string, idx: number) => (
                  <div
                    className={`${s.infoLine} ${idx === 0 ? s.infoLineAccent : ''}`}
                    key={`${line}-${idx}`}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <table className={s.invoiceTable}>
            <thead>
              <tr>
                <th>{isEnglish ? 'DESCRIPTION' : 'ОПИС'}</th>
                <th>{isEnglish ? 'RATE' : 'ЦІНА'}</th>
                <th>{isEnglish ? 'QTY' : 'К-СТЬ'}</th>
                <th>{isEnglish ? 'TOTAL' : 'СУМА'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item: any, index: number) => {
                const qty = getQty(item)
                const rate = Number.isFinite(Number(item?.price))
                  ? Number(item.price)
                  : qty
                  ? Number(item?.sum || 0) / qty
                  : Number(item?.sum || 0)

                return (
                  <tr key={`${item?.type || item?.name}-${index}`}>
                    <td>{item?.name || item?.type || '-'}</td>
                    <td>{rate.toFixed(2)}</td>
                    <td>{qty}</td>
                    <td>
                      {Number(item?.sum || 0).toFixed(2)} {currencyLabel}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className={s.summarySection}>
            <div className={s.invoiceDates}>
              <div className={s.infoRow}>
                <span>{isEnglish ? 'DATE:' : 'ДАТА:'}</span>
                <strong>{dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}</strong>
              </div>
              <div className={s.infoRow}>
                <span>{isEnglish ? 'DUE DATE:' : 'СТРОК ОПЛАТИ:'}</span>
                <strong>{dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}</strong>
              </div>
            </div>

            <div className={s.totalsBlock}>
              <div className={`${s.totalRow} ${s.grandTotal}`}>
                <span>{isEnglish ? 'TOTAL' : 'ВСЬОГО'}</span>
                <strong>
                  {total.toFixed(2)} {currencyLabel}
                </strong>
              </div>
            </div>
          </div>

          <div className={s.footerNote}>
            <strong>{isEnglish ? 'THANK YOU' : 'ДЯКУЄМО'}</strong>
            <div className={s.signatureLine}>______________</div>
          </div>
        </div>
      )}
    </>
  )
}

export default GroupedReceiptForm
