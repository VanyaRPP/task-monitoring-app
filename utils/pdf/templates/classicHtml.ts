import dayjs from 'dayjs'
import { preparePaymentData } from '../preparePaymentData'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatInvoiceDate(date?: string | null): string {
  if (!date) return ''
  const d = dayjs(date)
  return d.isValid() ? d.format('DD.MM.YYYY') : ''
}

function formatInvoiceDueDate(date?: string | null): string {
  if (!date) return ''
  const d = dayjs(date)
  return d.isValid() ? d.add(5, 'd').format('DD.MM.YYYY') : ''
}

export function generateClassicHtml(data: any): string {
  const {
    rows,
    getQty,
    subtotal,
    total,
    isEnglish,
    currencyLabel,
  } = preparePaymentData(data)

  const generalSum = (+data?.generalSum || +data?.debit || total).toFixed(2)
  const invoiceDate = formatInvoiceDate(data?.invoiceCreationDate)
  const invoiceDueDate = formatInvoiceDueDate(data?.invoiceCreationDate)

  const providerFirstLine = data?.domain?.name || data?.provider?.description?.split('\n')?.[0] || ''

  const tableRows = rows.map((item: any, index: number) => {
    const qty = getQty(item)
    const rate = Number.isFinite(Number(item?.price))
      ? Number(item.price)
      : qty
      ? Number(item?.sum || 0) / qty
      : Number(item?.sum || 0)
    const name = escapeHtml(item?.name || item?.type || '')

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${name}</td>
        <td>${qty}</td>
        <td>${rate.toFixed(2)}</td>
        <td>${Number(item?.sum || 0).toFixed(2)}</td>
      </tr>`
  }).join('')

  const providerDomainName = data?.domain?.name
    ? `<strong>${escapeHtml(data.domain.name)}</strong>\n`
    : ''
  const providerDescription = escapeHtml((data?.provider?.description || '').trim())

  const displayReceiverName = data?.company?.invoiceName || data?.reciever?.invoiceName || data?.reciever?.companyName

  const receiverCompanyName = displayReceiverName
    ? `<strong>${escapeHtml(displayReceiverName)}</strong>\n`
    : ''
  const receiverDescription = escapeHtml((data?.reciever?.description || '').trim())
  const receiverEmails = (data?.reciever?.adminEmails || [])
    .map((email: string) => escapeHtml(email))
    .join('\n')

  const paymentPurpose = isEnglish
    ? `Payment for services according to invoice № ${escapeHtml(String(data?.invoiceNumber || ''))} dated ${invoiceDate}`
    : `Оплата за послуги згідно рахунку № ${escapeHtml(String(data?.invoiceNumber || ''))} від ${invoiceDate}`

  return `<!DOCTYPE html>
<html lang="${isEnglish ? 'en' : 'uk'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice ${escapeHtml(String(data?.invoiceNumber || ''))}</title>
    <style>
      * { font-family: Arial, Helvetica, sans-serif; box-sizing: border-box; }
      body { margin: 0; padding: 0; background: #fff; color: #1a1a1a; }
      .invoice-wrapper {
        padding: 2rem 2.5rem;
        max-width: 860px;
        margin: 0 auto;
        width: 100%;
      }

      /* Provider / Receiver */
      .party-row {
        display: flex;
        align-items: flex-start;
        margin-bottom: 0.75rem;
        font-size: 14px;
      }
      .party-label {
        min-width: 130px;
        font-size: 14px;
        color: #555;
      }
      .party-value {
        flex: 1;
        white-space: pre-wrap;
        vertical-align: top;
        margin: 0;
        font-size: 14px;
        line-height: 1.55;
      }

      /* Invoice title */
      .invoice-title {
        text-align: center;
        margin: 1.4rem 0 0.6rem;
      }
      .invoice-title .title-number {
        font-size: 20px;
        font-weight: 700;
      }
      .invoice-title .title-date {
        font-weight: 700;
        font-size: 14px;
        margin: 0.3rem 0;
      }
      .invoice-title .title-due {
        font-size: 14px;
        margin: 0;
      }

      /* Table */
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
        font-size: 14px;
      }
      table th {
        padding: 0.7rem 0.5rem;
        text-align: left;
        background-color: #fafafa;
        border-bottom: 1px solid #e0e0e0;
        font-size: 13px;
        color: #555;
        letter-spacing: 0.03em;
      }
      table td {
        padding: 0.6rem 0.5rem;
        border-bottom: 1px solid #ececec;
        vertical-align: top;
      }

      /* Footer summary */
      .pay-table {
        margin-top: 1rem;
        font-size: 16px;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .pay-total {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .pay-sum {
        font-weight: 800;
        margin-left: 0.4rem;
      }
      .pay-purpose {
        font-size: 14px;
      }
      .pay-provider {
        font-size: 14px;
        color: #555;
      }

      @media print {
        @page { size: A4; margin: 12mm 14mm; }
        body { background: #fff !important; }
      }
    </style>
  </head>
  <body>
    <div class="invoice-wrapper">

      <div class="party-row">
        <div class="party-label">${isEnglish ? 'Provider' : 'Постачальник'}</div>
        <pre class="party-value">${providerDomainName}${providerDescription}</pre>
      </div>

      <div class="party-row">
        <div class="party-label">${isEnglish ? 'Recipient' : 'Одержувач'}</div>
        <pre class="party-value">${receiverCompanyName}${receiverDescription}${receiverEmails ? '\n' + receiverEmails : ''}</pre>
      </div>

      <div class="invoice-title">
        <div class="title-number">${isEnglish ? 'INVOICE №' : 'РАХУНОК №'} ${escapeHtml(String(data?.invoiceNumber || ''))}</div>
        <div class="title-date">${isEnglish ? 'Dated' : 'Від'} ${invoiceDate}${isEnglish ? '.' : ' року.'}</div>
        <div class="title-due">${isEnglish ? 'Due by' : 'Підлягає сплаті до'} ${invoiceDueDate}${isEnglish ? '' : ' року'}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>${isEnglish ? 'Name' : 'Назва'}</th>
            <th>${isEnglish ? 'Qty' : 'Кількість'}</th>
            <th>${isEnglish ? 'Price' : 'Ціна'}</th>
            <th>${isEnglish ? 'Amount' : 'Сума'}</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="pay-table">
        <div class="pay-total">
          ${isEnglish ? 'Total payment amount:' : 'Загальна сума оплати:'}
          <span class="pay-sum">${generalSum} ${escapeHtml(currencyLabel)}</span>
        </div>
        <div class="pay-purpose">
          ${isEnglish ? 'Payment purpose:' : 'Призначення платежу:'}
          <strong>${paymentPurpose}</strong>
        </div>
        <div class="pay-provider">${escapeHtml(providerFirstLine)}</div>
      </div>

    </div>
  </body>
</html>`
}
