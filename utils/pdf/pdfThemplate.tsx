import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import dayjs from 'dayjs'
import { generateClassicHtml } from './templates/classicHtml'
import { generateOlimpHtml } from './templates/olimpHtml'
import { generateLedgerHtml } from './templates/ledgerHtml'
import { generateOfficialHtml } from './templates/officialHtml'

function resolvePaymentTemplate(paymentData: any): string {
  return (
    paymentData?.template ||
    (typeof paymentData?.company === 'object' ? paymentData.company?.defaultTemplate : undefined) ||
    (typeof paymentData?.domain === 'object' ? paymentData.domain?.defaultTemplate : undefined) ||
    'classic'
  )
}

export async function generateHtmlFromThemplate(
  paymentData: IExtendedPayment | any
) {
  const isCredit = paymentData?.type === 'credit'

  if (isCredit) {
    const sum = (+paymentData?.generalSum || +paymentData?.debit || 0).toFixed(2)
    const tx = paymentData?.transaction
    const payerLines = [
      ...(paymentData?.reciever?.description?.trim() || '').split('\n').filter(Boolean),
      paymentData?.company?.companyName || paymentData?.reciever?.companyName || '',
      ...(paymentData?.company?.adminEmails || paymentData?.reciever?.adminEmails || []),
    ].filter(Boolean)

    return `
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8" />
        <title>Receipt</title>
        <style>
          * { font-family: Arial, Helvetica, sans-serif; }
          body { margin: 0; padding: 20px; }
          .title { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 4px; }
          .date { text-align: center; font-weight: 700; margin-bottom: 20px; }
          .section { width: 70%; margin: 0 auto; padding: 0 20px; }
          .section-title { font-weight: bold; margin-bottom: 10px; font-size: 14px; }
          .row { padding: 8px 12px; border: 1px solid rgba(136,136,136,0.2); border-bottom: none; font-size: 14px; line-height: 1.4; }
          .row:first-child { border-radius: 4px 4px 0 0; }
          .row:last-child { border-bottom: 1px solid rgba(136,136,136,0.2); border-radius: 0 0 4px 4px; }
          .row strong { font-weight: 600; margin-right: 8px; }
          .sum-row { padding: 12px 16px; border: 2px solid #1677ff; border-radius: 6px; font-weight: 700; margin-top: 8px; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="title">КВИТАНЦІЯ ПРО ОТРИМАННЯ ПЛАТЕЖУ № ${paymentData.invoiceNumber}</div>
        <div class="date">Від ${dayjs(paymentData?.invoiceCreationDate)?.format?.('DD.MM.YYYY')} року.</div>
        ${tx ? `
        <div class="section">
          <div class="section-title">Платник:</div>
          ${payerLines.map((line) => `<div class="row">${line}</div>`).join('')}
          <br/>
          <div class="section-title">Деталі транзакції:</div>
          <div class="row"><strong>Рахунок платника:</strong>${tx.AUT_CNTR_ACC || ''}</div>
          <div class="row"><strong>Назва платника:</strong>${tx.AUT_CNTR_NAM || ''}</div>
          <div class="row"><strong>МФО банку:</strong>${tx.AUT_CNTR_MFO || ''}</div>
          <div class="row"><strong>Призначення платежу:</strong>${tx.Description || ''}</div>
          <div class="sum-row"><strong>Отримана сума:</strong>${sum} грн</div>
        </div>` : ''}
      </body>
    </html>`
  }

  const templateKey = resolvePaymentTemplate(paymentData)
  if (templateKey === 'olimp') return generateOlimpHtml(paymentData)
  if (templateKey === 'ledger') return generateLedgerHtml(paymentData)
  if (templateKey === 'official') return generateOfficialHtml(paymentData)
  return generateClassicHtml(paymentData)
}

