import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import GroupedPricesTable from '@components/Forms/GroupedReceiptForm/GroupedPricesTable'
import { usePaymentContext } from '@components/AddPaymentModal'
import { CURRENCY_MAP } from '@utils/constants'
import dayjs from 'dayjs'
import { FC, useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { PrinterOutlined, EditOutlined, SendOutlined } from '@ant-design/icons'
import { Dropdown, Tooltip, message } from 'antd'
import s from './style.module.scss'
import cs from './templates/style.module.scss'
import sw from './templates/swiss.module.scss'
import sc from './templates/softcard.module.scss'
import ts from './templates/techstudio.module.scss'
import ml from './templates/monoline.module.scss'
import ed from './templates/editorial.module.scss'
import lg from './templates/ledger.module.scss'
import az from './templates/azure.module.scss'

const normalizeCurrency = (currency?: string): 'UAH' | 'USD' | 'EUR' => {
  const value = currency?.toUpperCase()
  if (value === 'USD' || value === 'EUR') return value
  return 'UAH'
}

const getCurrencyShortLabel = (currency?: string): string => {
  const normalized = normalizeCurrency(currency)
  const label = CURRENCY_MAP[normalized]?.label

  if (normalized === 'USD') return 'USD'
  if (normalized === 'EUR') return 'EUR'

  return label || 'грн'
}

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
    data?.company?.currency || company?.currency || data?.domain?.currency
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
    { key: 'classic',    label: 'Класичний шаблон' },
    { key: 'olimp',      label: 'OLIMP DIGITAL OÜ' },
    { key: 'swiss',      label: 'Swiss Minimal' },
    { key: 'softcard',   label: 'Soft Card Premium' },
    { key: 'techstudio', label: 'Tech Studio Invoice' },
    { key: 'monoline',   label: 'Monoline Business' },
    { key: 'editorial',  label: 'Editorial Premium' },
    { key: 'ledger',     label: 'Formal Ledger' },
    { key: 'azure',      label: 'Azure Corporate' },
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
        <SendOutlined 
          // className={s.telegramIcon} 
          // onClick={handleSendToTelegram} 
          // style={{ color: '#24A1DE' }}
        />
      <PrinterOutlined className={s.print} onClick={handlePrint} />
      <Dropdown
        trigger={['click']}
        menu={{
          items: templateItems,
          onClick: ({ key }) => setTemplate(key as 'classic' | 'olimp' | 'swiss' | 'softcard' | 'techstudio' | 'monoline' | 'editorial' | 'ledger' | 'azure'),
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
      ) : template === 'monoline' ? (
        <div
          className={ml.mlInvoice}
          ref={componentRef}
          style={{ width: '100%', margin: '2em auto 1em' }}
        >
          <div className={ml.mlHeader}>
            <div className={ml.mlBrand}>
              <div className={ml.mlBrandName}>
                {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
              </div>
              <span className={ml.mlBrandRule} />
              <div className={ml.mlBrandSub}>Digital Services</div>
            </div>
            <div className={ml.mlInvoiceMeta}>
              <div className={ml.mlInvoiceWord}>
                {isEnglish ? 'Invoice' : 'Рахунок'}
              </div>
              <div className={ml.mlInvoiceNumber}>№&thinsp;{modernInvoiceNumber}</div>
            </div>
          </div>

          <div className={ml.mlDateRow}>
            <div className={ml.mlDateItem}>
              <span className={ml.mlDateLabel}>{isEnglish ? 'Issue date' : 'Дата'}</span>
              <span className={ml.mlDateValue}>
                {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
              </span>
            </div>
            <div className={ml.mlDateItem}>
              <span className={ml.mlDateLabel}>{isEnglish ? 'Due date' : 'Строк оплати'}</span>
              <span className={ml.mlDateValue}>
                {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
              </span>
            </div>
            <div className={ml.mlDateItem}>
              <span className={ml.mlDateLabel}>{isEnglish ? 'Currency' : 'Валюта'}</span>
              <span className={ml.mlDateValue}>{currencyLabel}</span>
            </div>
          </div>

          <div className={ml.mlParties}>
            <div className={ml.mlParty}>
              <div className={ml.mlPartyLabel}>
                {isEnglish ? 'Bill from' : 'Платіжні дані'}
              </div>
              {paymentInfoLines.map((line: string, idx: number) => (
                <div
                  key={`pi-${idx}`}
                  className={idx === 0 ? ml.mlPartyName : ml.mlPartyLine}
                >
                  {line}
                </div>
              ))}

              {!!normalizedBankDetailsLines.length && (
                <div className={ml.mlBankBlock}>
                  {normalizedBankDetailsLines.map((line: string, idx: number) => {
                    const sep = line.indexOf(':')
                    if (sep < 0) {
                      return <div className={ml.mlBankLine} key={`bk-${idx}`}>{line}</div>
                    }
                    return (
                      <div className={ml.mlBankLine} key={`bk-${idx}`}>
                        <span className={ml.mlBankLineLabel}>{line.slice(0, sep + 1)}</span>
                        {line.slice(sep + 1)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={ml.mlParty}>
              <div className={ml.mlPartyLabel}>
                {isEnglish ? 'Issued to' : 'Отримувач'}
              </div>
              {issuedToLines.map((line: string, idx: number) => (
                <div
                  key={`it-${idx}`}
                  className={idx === 0 ? ml.mlPartyName : ml.mlPartyLine}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <table className={ml.mlTable}>
            <thead>
              <tr>
                <th>{isEnglish ? 'Description' : 'Опис'}</th>
                <th>{isEnglish ? 'Rate' : 'Ціна'}</th>
                <th>{isEnglish ? 'Qty' : 'К-сть'}</th>
                <th>{isEnglish ? 'Total' : 'Сума'}</th>
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
                    <td>{item?.name || item?.type || '—'}</td>
                    <td>{rate.toFixed(2)}</td>
                    <td>{qty}</td>
                    <td>{Number(item?.sum || 0).toFixed(2)}&nbsp;{currencyLabel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className={ml.mlTotalsArea}>
            <div className={ml.mlPaymentNote}>
              <div className={ml.mlPaymentNoteLabel}>
                {isEnglish ? 'Payment purpose' : 'Призначення платежу'}
              </div>
              <div className={ml.mlPaymentNoteText}>
                {isEnglish
                  ? `Payment for services according to invoice № ${data.invoiceNumber} dated ${dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}`
                  : `Оплата за послуги згідно рахунку № ${data.invoiceNumber} від ${dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}`}
              </div>
            </div>

            <div className={ml.mlTotalsBlock}>
              {taxPercent > 0 && (
                <>
                  <div className={ml.mlTotalRow}>
                    <span>{isEnglish ? 'Subtotal' : 'Підсумок'}</span>
                    <strong>{subtotal.toFixed(2)}&nbsp;{currencyLabel}</strong>
                  </div>
                  <div className={ml.mlTotalRow}>
                    <span>VAT {taxPercent}%</span>
                    <strong>{taxAmount.toFixed(2)}&nbsp;{currencyLabel}</strong>
                  </div>
                </>
              )}
              <div className={`${ml.mlTotalRow} ${ml.mlGrandTotal}`}>
                <span>{isEnglish ? 'Total Due' : 'До сплати'}</span>
                <strong>
                  {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;{currencyLabel}
                </strong>
              </div>
            </div>
          </div>

          <div className={ml.mlFooter}>
            <div className={ml.mlFooterNote}>
              {isEnglish ? 'Thank you for your business' : 'Дякуємо за співпрацю'}
            </div>
            <div className={ml.mlSignatureBlock}>
              <div className={ml.mlSignatureLine}>______________</div>
              <div className={ml.mlSignatureCaption}>
                {data?.provider?.description?.split('\n')?.[0] || ''}
              </div>
            </div>
          </div>
        </div>
      ) : template === 'techstudio' ? (
        <div
          className={ts.tsInvoice}
          ref={componentRef}
          style={{ width: '100%', margin: '2em auto 1em' }}
        >
          <div className={ts.tsTopBar}>
            <div className={ts.tsWindowDots}>
              <div className={ts.tsDot} />
              <div className={ts.tsDot} />
              <div className={ts.tsDot} />
            </div>
            <div className={ts.tsFilePath}>
              ~/invoices/{isEnglish ? 'invoice' : 'rakhunok'}_{modernInvoiceNumber}.pdf
            </div>
            <div className={ts.tsBadge}>
              {isEnglish ? 'PENDING' : 'ОЧІКУЄ'}
            </div>
          </div>

          <div className={ts.tsHeader}>
            <div className={ts.tsBrand}>
              <div className={ts.tsBrandIcon}>
                <div className={ts.tsBrandIconBox}>OD</div>
                <div className={ts.tsBrandName}>
                  {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
                </div>
              </div>
              <div className={ts.tsBrandSub}>digital_services.est</div>
            </div>
            <div className={ts.tsInvoiceHead}>
              <h1>{isEnglish ? 'INVOICE' : 'РАХУНОК'}</h1>
              <span className={ts.tsInvoiceNum}>id::{modernInvoiceNumber}</span>
            </div>
          </div>

          <div className={ts.tsMeta}>
            <div className={ts.tsMetaItem}>
              <span className={ts.tsMetaLabel}>issued_at</span>
              <span className={ts.tsMetaValue}>
                {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
              </span>
            </div>
            <div className={ts.tsMetaItem}>
              <span className={ts.tsMetaLabel}>due_date</span>
              <span className={ts.tsMetaValue}>
                {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
              </span>
            </div>
            <div className={ts.tsMetaItem}>
              <span className={ts.tsMetaLabel}>invoice_id</span>
              <span className={ts.tsMetaValue}>{modernInvoiceNumber}</span>
            </div>
            <div className={ts.tsMetaItem}>
              <span className={ts.tsMetaLabel}>currency</span>
              <span className={ts.tsMetaValue}>{currencyLabel}</span>
            </div>
          </div>

          <div className={ts.tsParties}>
            <div className={ts.tsPartyCard}>
              <div className={ts.tsPartyLabel}>
                {isEnglish ? 'Bill from' : 'Платіжні дані'}
              </div>
              {paymentInfoLines.map((line: string, idx: number) => (
                <div
                  key={`pi-${idx}`}
                  className={idx === 0 ? ts.tsPartyName : ts.tsPartyLine}
                >
                  {line}
                </div>
              ))}

              {!!normalizedBankDetailsLines.length && (
                <div className={ts.tsBankCard}>
                  {normalizedBankDetailsLines.map((line: string, idx: number) => {
                    const sep = line.indexOf(':')
                    if (sep < 0) {
                      return <div className={ts.tsBankLine} key={`bk-${idx}`}>{line}</div>
                    }
                    return (
                      <div className={ts.tsBankLine} key={`bk-${idx}`}>
                        <span className={ts.tsBankLineLabel}>{line.slice(0, sep + 1)}</span>
                        {line.slice(sep + 1)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={ts.tsPartyCard}>
              <div className={ts.tsPartyLabel}>
                {isEnglish ? 'Issued to' : 'Отримувач'}
              </div>
              {issuedToLines.map((line: string, idx: number) => (
                <div
                  key={`it-${idx}`}
                  className={idx === 0 ? ts.tsPartyName : ts.tsPartyLine}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className={ts.tsTableWrap}>
            <table className={ts.tsTable}>
              <thead>
                <tr>
                  <th>{isEnglish ? 'description' : 'опис'}</th>
                  <th>{isEnglish ? 'rate' : 'ціна'}</th>
                  <th>{isEnglish ? 'qty' : 'к-сть'}</th>
                  <th>{isEnglish ? 'total' : 'сума'}</th>
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
                      <td>{item?.name || item?.type || '—'}</td>
                      <td>{rate.toFixed(2)}</td>
                      <td>{qty}</td>
                      <td>{Number(item?.sum || 0).toFixed(2)}&nbsp;{currencyLabel}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={ts.tsSummary}>
            <div className={ts.tsDates}>
              <div className={ts.tsDateRow}>
                <span>{isEnglish ? 'issued' : 'дата'}</span>
                <strong>{dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}</strong>
              </div>
              <div className={ts.tsDateRow}>
                <span>{isEnglish ? 'due' : 'строк'}</span>
                <strong>{dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}</strong>
              </div>
            </div>

            <div className={ts.tsTotalsCard}>
              {taxPercent > 0 && (
                <>
                  <div className={ts.tsTotalRow}>
                    <span>{isEnglish ? 'subtotal' : 'підсумок'}</span>
                    <strong>{subtotal.toFixed(2)}&nbsp;{currencyLabel}</strong>
                  </div>
                  <div className={ts.tsTotalRow}>
                    <span>vat_{taxPercent}%</span>
                    <strong>{taxAmount.toFixed(2)}&nbsp;{currencyLabel}</strong>
                  </div>
                </>
              )}
              <div className={`${ts.tsTotalRow} ${ts.tsGrandTotal}`}>
                <span>{isEnglish ? 'TOTAL_DUE' : 'ДО_СПЛАТИ'}</span>
                <strong>
                  {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;{currencyLabel}
                </strong>
              </div>
            </div>
          </div>

          <div className={ts.tsFooter}>
            <div className={ts.tsFooterLeft}>
              <div className={ts.tsFooterComment}>
                {isEnglish ? 'Thank you for your business' : 'Дякуємо за співпрацю'}
              </div>
              <div className={ts.tsFooterStatus}>
                {isEnglish ? 'STATUS: AWAITING_PAYMENT' : 'СТАТУС: ОЧІКУЄ_ОПЛАТИ'}
              </div>
            </div>
            <div className={ts.tsSignatureBlock}>
              <div className={ts.tsSignatureLine}>______________</div>
              <div className={ts.tsSignatureCaption}>
                {data?.provider?.description?.split('\n')?.[0] || ''}
              </div>
            </div>
          </div>
        </div>
      ) : template === 'softcard' ? (
        <div
          className={sc.scInvoice}
          ref={componentRef}
          style={{ width: '100%', margin: '2em auto 1em' }}
        >
          <div className={sc.scHeader}>
            <div className={sc.scBrand}>
              <div className={sc.scBrandName}>
                {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
              </div>
              <div className={sc.scBrandSub}>Digital Services</div>
            </div>
            <div className={sc.scInvoiceTitle}>
              <h1>{isEnglish ? 'INVOICE' : 'РАХУНОК'}</h1>
              <span className={sc.scInvoiceNum}>№&thinsp;{modernInvoiceNumber}</span>
            </div>
          </div>

          <div className={sc.scMeta}>
            <div className={sc.scMetaItem}>
              <span className={sc.scMetaLabel}>{isEnglish ? 'Date' : 'Дата'}</span>
              <span className={sc.scMetaValue}>
                {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
              </span>
            </div>
            <div className={sc.scMetaItem}>
              <span className={sc.scMetaLabel}>{isEnglish ? 'Due date' : 'Строк оплати'}</span>
              <span className={sc.scMetaValue}>
                {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
              </span>
            </div>
            <div className={sc.scMetaItem}>
              <span className={sc.scMetaLabel}>{isEnglish ? 'Invoice №' : 'Рахунок №'}</span>
              <span className={sc.scMetaValue}>{modernInvoiceNumber}</span>
            </div>
            <div className={sc.scMetaItem}>
              <span className={sc.scMetaLabel}>{isEnglish ? 'Currency' : 'Валюта'}</span>
              <span className={sc.scMetaValue}>{currencyLabel}</span>
            </div>
          </div>

          <div className={sc.scParties}>
            <div className={sc.scPartyStack}>
              <div className={sc.scPartyCard}>
                <div className={sc.scPartyLabel}>
                  {isEnglish ? 'Bill from' : 'Платіжні дані'}
                </div>
                {paymentInfoLines.map((line: string, idx: number) => (
                  <div
                    key={`pi-${idx}`}
                    className={idx === 0 ? sc.scPartyName : sc.scPartyLine}
                  >
                    {line}
                  </div>
                ))}

                {!!normalizedBankDetailsLines.length && (
                  <div className={sc.scBankCard}>
                    {normalizedBankDetailsLines.map((line: string, idx: number) => {
                      const sep = line.indexOf(':')
                      if (sep < 0) {
                        return (
                          <div className={sc.scBankLine} key={`bk-${idx}`}>
                            {line}
                          </div>
                        )
                      }
                      return (
                        <div className={sc.scBankLine} key={`bk-${idx}`}>
                          <span className={sc.scBankLineLabel}>{line.slice(0, sep + 1)}</span>
                          {line.slice(sep + 1)}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className={sc.scPartyCard}>
              <div className={sc.scPartyLabel}>
                {isEnglish ? 'Issued to' : 'Отримувач'}
              </div>
              {issuedToLines.map((line: string, idx: number) => (
                <div
                  key={`it-${idx}`}
                  className={idx === 0 ? sc.scPartyName : sc.scPartyLine}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className={sc.scTableCard}>
            <table className={sc.scTable}>
              <thead>
                <tr>
                  <th>{isEnglish ? 'Description' : 'Опис'}</th>
                  <th>{isEnglish ? 'Rate' : 'Ціна'}</th>
                  <th>{isEnglish ? 'Qty' : 'К-сть'}</th>
                  <th>{isEnglish ? 'Total' : 'Сума'}</th>
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
                      <td>{item?.name || item?.type || '—'}</td>
                      <td>{rate.toFixed(2)}</td>
                      <td>{qty}</td>
                      <td>
                        {Number(item?.sum || 0).toFixed(2)}&nbsp;{currencyLabel}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={sc.scSummary}>
            <div className={sc.scDates}>
              <div className={sc.scDateRow}>
                <span>{isEnglish ? 'Date' : 'Дата'}</span>
                <strong>{dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}</strong>
              </div>
              <div className={sc.scDateRow}>
                <span>{isEnglish ? 'Due date' : 'Строк оплати'}</span>
                <strong>
                  {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
                </strong>
              </div>
            </div>

            <div className={sc.scTotalsCard}>
              {taxPercent > 0 && (
                <>
                  <div className={sc.scTotalRow}>
                    <span>{isEnglish ? 'Subtotal' : 'Підсумок'}</span>
                    <strong>{subtotal.toFixed(2)}&nbsp;{currencyLabel}</strong>
                  </div>
                  <div className={sc.scTotalRow}>
                    <span>VAT {taxPercent}%</span>
                    <strong>{taxAmount.toFixed(2)}&nbsp;{currencyLabel}</strong>
                  </div>
                </>
              )}
              <div className={`${sc.scTotalRow} ${sc.scGrandTotal}`}>
                <span>{isEnglish ? 'Total due' : 'До сплати'}</span>
                <strong>
                  {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;{currencyLabel}
                </strong>
              </div>
            </div>
          </div>

          <div className={sc.scFooter}>
            <div className={sc.scThankYou}>
              {isEnglish ? 'Thank you for your business' : 'Дякуємо за співпрацю'}
            </div>
            <div className={sc.scSignatureBlock}>
              <div className={sc.scSignatureLine}>______________</div>
              <div className={sc.scSignatureCaption}>
                {data?.provider?.description?.split('\n')?.[0] || ''}
              </div>
            </div>
          </div>
        </div>
      ) : template === 'editorial' ? (
        <div
          className={ed.edInvoice}
          ref={componentRef}
          style={{ width: '100%', margin: '2em auto 1em' }}
        >
          <div className={ed.edHeader}>
            <div className={ed.edBrand}>
              <div className={ed.edBrandName}>
                {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
              </div>
              <div className={ed.edBrandSub}>Digital Services</div>
            </div>
            <div className={ed.edInvoiceTitle}>
              <h1>{isEnglish ? 'Invoice' : 'Рахунок'}</h1>
              <span className={ed.edInvoiceNum}>№&thinsp;{modernInvoiceNumber}</span>
            </div>
          </div>

          <div className={ed.edMeta}>
            <div className={ed.edMetaItem}>
              <span className={ed.edMetaLabel}>{isEnglish ? 'Date' : 'Дата'}</span>
              <span className={ed.edMetaValue}>
                {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
              </span>
            </div>
            <div className={ed.edMetaItem}>
              <span className={ed.edMetaLabel}>{isEnglish ? 'Due date' : 'Строк оплати'}</span>
              <span className={ed.edMetaValue}>
                {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
              </span>
            </div>
            <div className={ed.edMetaItem}>
              <span className={ed.edMetaLabel}>{isEnglish ? 'Currency' : 'Валюта'}</span>
              <span className={ed.edMetaValue}>{currencyLabel}</span>
            </div>
          </div>

          <div className={ed.edParties}>
            <div className={ed.edParty}>
              <div className={ed.edPartyLabel}>
                {isEnglish ? 'Bill from' : 'Платіжні дані'}
              </div>
              {paymentInfoLines.map((line: string, idx: number) => (
                <div
                  key={`pi-${idx}`}
                  className={idx === 0 ? ed.edPartyName : ed.edPartyLine}
                >
                  {line}
                </div>
              ))}
              {!!normalizedBankDetailsLines.length && (
                <div className={ed.edBankBlock}>
                  {normalizedBankDetailsLines.map((line: string, idx: number) => {
                    const sep = line.indexOf(':')
                    if (sep < 0) {
                      return <div className={ed.edBankLine} key={`bk-${idx}`}>{line}</div>
                    }
                    return (
                      <div className={ed.edBankLine} key={`bk-${idx}`}>
                        <span className={ed.edBankLineLabel}>{line.slice(0, sep + 1)}</span>
                        {line.slice(sep + 1)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className={ed.edParty}>
              <div className={ed.edPartyLabel}>
                {isEnglish ? 'Issued to' : 'Отримувач'}
              </div>
              {issuedToLines.map((line: string, idx: number) => (
                <div
                  key={`it-${idx}`}
                  className={idx === 0 ? ed.edPartyName : ed.edPartyLine}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <table className={ed.edTable}>
            <thead>
              <tr>
                <th>{isEnglish ? 'Description' : 'Опис'}</th>
                <th>{isEnglish ? 'Rate' : 'Ціна'}</th>
                <th>{isEnglish ? 'Qty' : 'К-сть'}</th>
                <th>{isEnglish ? 'Total' : 'Сума'}</th>
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
                    <td>{item?.name || item?.type || '—'}</td>
                    <td>{rate.toFixed(2)}</td>
                    <td>{qty}</td>
                    <td>{Number(item?.sum || 0).toFixed(2)}&nbsp;{currencyLabel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className={ed.edTotalsArea}>
            <div className={ed.edPaymentNote}>
              <div className={ed.edPaymentNoteLabel}>
                {isEnglish ? 'Payment purpose' : 'Призначення платежу'}
              </div>
              <div className={ed.edPaymentNoteText}>
                {isEnglish
                  ? `Payment for services according to invoice № ${data.invoiceNumber} dated ${dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}`
                  : `Оплата за послуги згідно рахунку № ${data.invoiceNumber} від ${dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}`}
              </div>
            </div>
            <div className={ed.edTotalsBlock}>
              {taxPercent > 0 && (
                <>
                  <div className={ed.edTotalRow}>
                    <span>{isEnglish ? 'Subtotal' : 'Підсумок'}</span>
                    <strong>{subtotal.toFixed(2)}&nbsp;{currencyLabel}</strong>
                  </div>
                  <div className={ed.edTotalRow}>
                    <span>VAT {taxPercent}%</span>
                    <strong>{taxAmount.toFixed(2)}&nbsp;{currencyLabel}</strong>
                  </div>
                </>
              )}
              <div className={`${ed.edTotalRow} ${ed.edGrandTotal}`}>
                <span>{isEnglish ? 'Total Due' : 'До сплати'}</span>
                <strong>
                  {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;{currencyLabel}
                </strong>
              </div>
            </div>
          </div>

          <div className={ed.edFooter}>
            <div className={ed.edFooterNote}>
              {isEnglish ? 'Thank you for your business' : 'Дякуємо за співпрацю'}
            </div>
            <div className={ed.edSignatureBlock}>
              <div className={ed.edSignatureLine}>______________</div>
              <div className={ed.edSignatureCaption}>
                {data?.provider?.description?.split('\n')?.[0] || ''}
              </div>
            </div>
          </div>
        </div>
      ) : template === 'ledger' ? (
        <div
          className={lg.lgInvoice}
          ref={componentRef}
          style={{ width: '100%', margin: '2em auto 1em' }}
        >
          <div className={lg.lgHeader}>
            <div className={lg.lgBrand}>
              <div className={lg.lgBrandName}>
                {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
              </div>
              <div className={lg.lgBrandSub}>Digital Services</div>
            </div>
            <div className={lg.lgInvoiceTitle}>
              <div className={lg.lgDocType}>
                {isEnglish ? 'Invoice' : 'Рахунок'}
              </div>
              <div className={lg.lgInvoiceNumber}>№ {modernInvoiceNumber}</div>
            </div>
          </div>

          <div className={lg.lgMeta}>
            <div className={lg.lgMetaCell}>
              <div className={lg.lgMetaCellLabel}>{isEnglish ? 'Issue date' : 'Дата'}</div>
              <div className={lg.lgMetaCellValue}>
                {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
              </div>
            </div>
            <div className={lg.lgMetaCell}>
              <div className={lg.lgMetaCellLabel}>{isEnglish ? 'Due date' : 'Строк оплати'}</div>
              <div className={lg.lgMetaCellValue}>
                {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
              </div>
            </div>
            <div className={lg.lgMetaCell}>
              <div className={lg.lgMetaCellLabel}>{isEnglish ? 'Invoice №' : 'Рахунок №'}</div>
              <div className={lg.lgMetaCellValue}>{modernInvoiceNumber}</div>
            </div>
            <div className={lg.lgMetaCell}>
              <div className={lg.lgMetaCellLabel}>{isEnglish ? 'Currency' : 'Валюта'}</div>
              <div className={lg.lgMetaCellValue}>{currencyLabel}</div>
            </div>
          </div>

          <div className={lg.lgParties}>
            <div className={lg.lgPartyBox}>
              <div className={lg.lgPartyHeader}>
                {isEnglish ? 'Bill from' : 'Платіжні дані'}
              </div>
              <div className={lg.lgPartyBody}>
                {paymentInfoLines.map((line: string, idx: number) => (
                  <div
                    key={`pi-${idx}`}
                    className={idx === 0 ? lg.lgPartyName : lg.lgPartyLine}
                  >
                    {line}
                  </div>
                ))}
                {!!normalizedBankDetailsLines.length && (
                  <div className={lg.lgBankSection}>
                    {normalizedBankDetailsLines.map((line: string, idx: number) => {
                      const sep = line.indexOf(':')
                      if (sep < 0) {
                        return <div className={lg.lgBankLine} key={`bk-${idx}`}>{line}</div>
                      }
                      return (
                        <div className={lg.lgBankLine} key={`bk-${idx}`}>
                          <span className={lg.lgBankLineLabel}>{line.slice(0, sep + 1)}</span>
                          {line.slice(sep + 1)}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className={lg.lgPartyBox}>
              <div className={lg.lgPartyHeader}>
                {isEnglish ? 'Issued to' : 'Отримувач'}
              </div>
              <div className={lg.lgPartyBody}>
                {issuedToLines.map((line: string, idx: number) => (
                  <div
                    key={`it-${idx}`}
                    className={idx === 0 ? lg.lgPartyName : lg.lgPartyLine}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={lg.lgTableWrap}>
            <table className={lg.lgTable}>
              <thead>
                <tr>
                  <th>{isEnglish ? 'Description' : 'Опис'}</th>
                  <th>{isEnglish ? 'Rate' : 'Ціна'}</th>
                  <th>{isEnglish ? 'Qty' : 'К-сть'}</th>
                  <th>{isEnglish ? 'Total' : 'Сума'}</th>
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
                      <td>{item?.name || item?.type || '—'}</td>
                      <td>{rate.toFixed(2)}</td>
                      <td>{qty}</td>
                      <td>{Number(item?.sum || 0).toFixed(2)}&nbsp;{currencyLabel}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={lg.lgSummary}>
            <div className={lg.lgDates}>
              <div className={lg.lgDatesHeader}>
                {isEnglish ? 'Dates' : 'Дати'}
              </div>
              <div className={lg.lgDatesBody}>
                <div className={lg.lgDateRow}>
                  <span>{isEnglish ? 'Issued' : 'Дата'}</span>
                  <strong>{dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}</strong>
                </div>
                <div className={lg.lgDateRow}>
                  <span>{isEnglish ? 'Due' : 'Строк'}</span>
                  <strong>{dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}</strong>
                </div>
              </div>
            </div>
            <div className={lg.lgTotalsBox}>
              <div className={lg.lgTotalsHeader}>
                {isEnglish ? 'Summary' : 'Підсумок'}
              </div>
              <div className={lg.lgTotalsBody}>
                {taxPercent > 0 && (
                  <>
                    <div className={lg.lgTotalRow}>
                      <span>{isEnglish ? 'Subtotal' : 'Підсумок'}</span>
                      <strong>{subtotal.toFixed(2)}&nbsp;{currencyLabel}</strong>
                    </div>
                    <div className={lg.lgTotalRow}>
                      <span>VAT {taxPercent}%</span>
                      <strong>{taxAmount.toFixed(2)}&nbsp;{currencyLabel}</strong>
                    </div>
                  </>
                )}
                <div className={`${lg.lgTotalRow} ${lg.lgGrandTotal}`}>
                  <span>{isEnglish ? 'Total due' : 'До сплати'}</span>
                  <strong>
                    {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;{currencyLabel}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className={lg.lgFooter}>
            <div className={lg.lgFooterNote}>
              {isEnglish ? 'Thank you for your business' : 'Дякуємо за співпрацю'}
            </div>
            <div className={lg.lgSignatureBlock}>
              <div className={lg.lgSignatureLine}>______________</div>
              <div className={lg.lgSignatureCaption}>
                {data?.provider?.description?.split('\n')?.[0] || ''}
              </div>
            </div>
          </div>
        </div>
      ) : template === 'azure' ? (
        <div
          className={az.azInvoice}
          ref={componentRef}
          style={{ width: '100%', margin: '2em auto 1em' }}
        >
          <div className={az.azHeader}>
            <div className={az.azBrand}>
              <div className={az.azBrandIcon}>OD</div>
              <div className={az.azBrandText}>
                <div className={az.azBrandName}>
                  {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
                </div>
                <div className={az.azBrandSub}>Digital Services</div>
              </div>
            </div>
            <div className={az.azInvoiceHead}>
              <h1>{isEnglish ? 'INVOICE' : 'РАХУНОК'}</h1>
              <span className={az.azInvoiceNum}>№&thinsp;{modernInvoiceNumber}</span>
            </div>
          </div>

          <div className={az.azMeta}>
            <div className={az.azMetaItem}>
              <span className={az.azMetaLabel}>{isEnglish ? 'Date' : 'Дата'}</span>
              <span className={az.azMetaValue}>
                {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
              </span>
            </div>
            <div className={az.azMetaItem}>
              <span className={az.azMetaLabel}>{isEnglish ? 'Due date' : 'Строк оплати'}</span>
              <span className={az.azMetaValue}>
                {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
              </span>
            </div>
            <div className={az.azMetaItem}>
              <span className={az.azMetaLabel}>{isEnglish ? 'Invoice №' : 'Рахунок №'}</span>
              <span className={az.azMetaValue}>{modernInvoiceNumber}</span>
            </div>
            <div className={az.azMetaItem}>
              <span className={az.azMetaLabel}>{isEnglish ? 'Currency' : 'Валюта'}</span>
              <span className={az.azMetaValue}>{currencyLabel}</span>
            </div>
          </div>

          <div className={az.azParties}>
            <div className={az.azPartyCard}>
              <div className={az.azPartyLabel}>
                {isEnglish ? 'Bill from' : 'Платіжні дані'}
              </div>
              {paymentInfoLines.map((line: string, idx: number) => (
                <div
                  key={`pi-${idx}`}
                  className={idx === 0 ? az.azPartyName : az.azPartyLine}
                >
                  {line}
                </div>
              ))}
              {!!normalizedBankDetailsLines.length && (
                <div className={az.azBankCard}>
                  {normalizedBankDetailsLines.map((line: string, idx: number) => {
                    const sep = line.indexOf(':')
                    if (sep < 0) {
                      return <div className={az.azBankLine} key={`bk-${idx}`}>{line}</div>
                    }
                    return (
                      <div className={az.azBankLine} key={`bk-${idx}`}>
                        <span className={az.azBankLineLabel}>{line.slice(0, sep + 1)}</span>
                        {line.slice(sep + 1)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className={az.azPartyCard}>
              <div className={az.azPartyLabel}>
                {isEnglish ? 'Issued to' : 'Отримувач'}
              </div>
              {issuedToLines.map((line: string, idx: number) => (
                <div
                  key={`it-${idx}`}
                  className={idx === 0 ? az.azPartyName : az.azPartyLine}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className={az.azTableWrap}>
            <table className={az.azTable}>
              <thead>
                <tr>
                  <th>{isEnglish ? 'Description' : 'Опис'}</th>
                  <th>{isEnglish ? 'Rate' : 'Ціна'}</th>
                  <th>{isEnglish ? 'Qty' : 'К-сть'}</th>
                  <th>{isEnglish ? 'Total' : 'Сума'}</th>
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
                      <td>{item?.name || item?.type || '—'}</td>
                      <td>{rate.toFixed(2)}</td>
                      <td>{qty}</td>
                      <td>{Number(item?.sum || 0).toFixed(2)}&nbsp;{currencyLabel}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={az.azSummary}>
            <div className={az.azDates}>
              <div className={az.azDateRow}>
                <span>{isEnglish ? 'Issued' : 'Дата'}</span>
                <strong>{dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}</strong>
              </div>
              <div className={az.azDateRow}>
                <span>{isEnglish ? 'Due' : 'Строк'}</span>
                <strong>{dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}</strong>
              </div>
            </div>
            <div className={az.azTotalsCard}>
              {taxPercent > 0 && (
                <>
                  <div className={az.azTotalRow}>
                    <span>{isEnglish ? 'Subtotal' : 'Підсумок'}</span>
                    <strong>{subtotal.toFixed(2)}&nbsp;{currencyLabel}</strong>
                  </div>
                  <div className={az.azTotalRow}>
                    <span>VAT {taxPercent}%</span>
                    <strong>{taxAmount.toFixed(2)}&nbsp;{currencyLabel}</strong>
                  </div>
                </>
              )}
              <div className={`${az.azTotalRow} ${az.azGrandTotal}`}>
                <span>{isEnglish ? 'TOTAL DUE' : 'ДО СПЛАТИ'}</span>
                <strong>
                  {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;{currencyLabel}
                </strong>
              </div>
            </div>
          </div>

          <div className={az.azFooter}>
            <div className={az.azFooterLeft}>
              <div className={az.azFooterNote}>
                {isEnglish ? 'Thank you for your business' : 'Дякуємо за співпрацю'}
              </div>
              <div className={az.azFooterBadge}>
                {isEnglish ? 'AWAITING PAYMENT' : 'ОЧІКУЄ ОПЛАТИ'}
              </div>
            </div>
            <div className={az.azSignatureBlock}>
              <div className={az.azSignatureLine}>______________</div>
              <div className={az.azSignatureCaption}>
                {data?.provider?.description?.split('\n')?.[0] || ''}
              </div>
            </div>
          </div>
        </div>
      ) : template === 'swiss' ? (
        <div
          className={sw.swissInvoice}
          ref={componentRef}
          style={{ width: '100%', margin: '2em auto 1em' }}
        >
          <div className={sw.swissHeader}>
            <div className={sw.swissBrand}>
              <div className={sw.swissBrandName}>
                {data?.reciever?.companyName || 'OLIMP DIGITAL OÜ'}
              </div>
              <div className={sw.swissBrandSub}>Digital Services</div>
            </div>
            <div className={sw.swissInvoiceLabel}>
              <h1>{isEnglish ? 'INVOICE' : 'РАХУНОК'}</h1>
              <span className={sw.swissInvoiceNumber}>№&thinsp;{modernInvoiceNumber}</span>
            </div>
          </div>

          <div className={sw.swissMeta}>
            <div className={sw.swissMetaItem}>
              <span className={sw.swissMetaLabel}>{isEnglish ? 'Date' : 'Дата'}</span>
              <span className={sw.swissMetaValue}>
                {dayjs(data?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
              </span>
            </div>
            <div className={sw.swissMetaItem}>
              <span className={sw.swissMetaLabel}>{isEnglish ? 'Due date' : 'Строк оплати'}</span>
              <span className={sw.swissMetaValue}>
                {dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')}
              </span>
            </div>
            <div className={sw.swissMetaItem}>
              <span className={sw.swissMetaLabel}>{isEnglish ? 'Currency' : 'Валюта'}</span>
              <span className={sw.swissMetaValue}>{currencyLabel}</span>
            </div>
          </div>

          <div className={sw.swissParties}>
            <div className={sw.swissParty}>
              <div className={sw.swissPartyLabel}>
                {isEnglish ? 'Bill from' : 'Платіжні дані'}
              </div>
              {paymentInfoLines.map((line: string, idx: number) => (
                <div
                  key={`pi-${idx}`}
                  className={
                    idx === 0
                      ? `${sw.swissPartyLine} ${sw.swissPartyLineStrong}`
                      : sw.swissPartyLine
                  }
                >
                  {line}
                </div>
              ))}

              {!!normalizedBankDetailsLines.length && (
                <div className={sw.swissBankCard}>
                  {normalizedBankDetailsLines.map((line: string, idx: number) => {
                    const sep = line.indexOf(':')
                    if (sep < 0) {
                      return (
                        <div className={sw.swissPartyLine} key={`bk-${idx}`}>
                          {line}
                        </div>
                      )
                    }
                    return (
                      <div className={sw.swissPartyLine} key={`bk-${idx}`}>
                        <span className={sw.swissBankLabel}>{line.slice(0, sep + 1)}</span>
                        {line.slice(sep + 1)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={sw.swissParty}>
              <div className={sw.swissPartyLabel}>
                {isEnglish ? 'Issued to' : 'Отримувач'}
              </div>
              {issuedToLines.map((line: string, idx: number) => (
                <div
                  key={`it-${idx}`}
                  className={
                    idx === 0
                      ? `${sw.swissPartyLine} ${sw.swissPartyLineStrong}`
                      : sw.swissPartyLine
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <table className={sw.swissTable}>
            <thead>
              <tr>
                <th>{isEnglish ? 'Description' : 'Опис'}</th>
                <th>{isEnglish ? 'Rate' : 'Ціна'}</th>
                <th>{isEnglish ? 'Qty' : 'К-сть'}</th>
                <th>{isEnglish ? 'Total' : 'Сума'}</th>
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
                    <td>{item?.name || item?.type || '—'}</td>
                    <td>{rate.toFixed(2)}</td>
                    <td>{qty}</td>
                    <td>
                      {Number(item?.sum || 0).toFixed(2)}&nbsp;{currencyLabel}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className={sw.swissTotals}>
            <div className={sw.swissTotalsBlock}>
              {taxPercent > 0 && (
                <>
                  <div className={sw.swissTotalRow}>
                    <span>{isEnglish ? 'Subtotal' : 'Підсумок'}</span>
                    <strong>{subtotal.toFixed(2)}&nbsp;{currencyLabel}</strong>
                  </div>
                  <div className={sw.swissTotalRow}>
                    <span>VAT {taxPercent}%</span>
                    <strong>{taxAmount.toFixed(2)}&nbsp;{currencyLabel}</strong>
                  </div>
                </>
              )}
              <div className={`${sw.swissTotalRow} ${sw.swissGrandTotal}`}>
                <span>{isEnglish ? 'Total due' : 'До сплати'}</span>
                <strong>
                  {(+data?.generalSum || +data?.debit || total).toFixed(2)}&nbsp;{currencyLabel}
                </strong>
              </div>
            </div>
          </div>

          <div className={sw.swissFooter}>
            <div className={sw.swissThankYou}>
              {isEnglish ? 'Thank you' : 'Дякуємо'}
            </div>
            <div className={sw.swissSignatureBlock}>
              <div className={sw.swissSignatureLine}>______________</div>
              <div className={sw.swissSignatureCaption}>
                {data?.provider?.description?.split('\n')?.[0] || ''}
              </div>
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
