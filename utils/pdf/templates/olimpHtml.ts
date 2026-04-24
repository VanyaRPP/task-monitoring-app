import dayjs from 'dayjs'
import { preparePaymentData } from '../preparePaymentData'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Render a bank-details line: bold the label part before the colon, and bold "USD" occurrences. */
function renderBankDetailsLineHtml(line: string): string {
  const trimmed = line?.trim?.() || ''
  const sepIdx = trimmed.indexOf(':')

  const boldUsd = (text: string): string =>
    text.replace(/(USD)/gi, '<strong>$1</strong>')

  if (sepIdx < 0) return boldUsd(escapeHtml(trimmed))

  const label = escapeHtml(trimmed.slice(0, sepIdx + 1))
  const value = escapeHtml(trimmed.slice(sepIdx + 1).trim())

  return `<span class="bank-details-label">${boldUsd(label)}</span>${value ? ' ' + boldUsd(value) : ''}`
}

export function generateOlimpHtml(data: any): string {
  const {
    rows,
    getQty,
    subtotal,
    total,
    isEnglish,
    currencyLabel,
    modernInvoiceNumber,
    paymentInfoLines,
    issuedToLines,
    normalizedBankDetailsLines,
  } = preparePaymentData(data)

  const invoiceDate = dayjs(data?.invoiceCreationDate).isValid()
    ? dayjs(data?.invoiceCreationDate).format('DD.MM.YYYY')
    : ''
  const invoiceDueDate = dayjs(data?.invoiceCreationDate).isValid()
    ? dayjs(data?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')
    : ''

  const monthYear = (() => {
    const d = data?.monthService?.date
    if (!d) return ''
    const locale = isEnglish ? 'en' : 'uk'
    try {
      return dayjs(d).locale(locale).format('MMMM YYYY')
    } catch {
      return dayjs(d).format('MMMM YYYY')
    }
  })()

  const tableRows = rows.map((item: any) => {
    const qty = getQty(item)
    const rate = Number.isFinite(Number(item?.price))
      ? Number(item.price)
      : qty
      ? Number(item?.sum || 0) / qty
      : Number(item?.sum || 0)
    const name = escapeHtml(item?.name || item?.type || '')

    return `
        <tr>
          <td>${name}</td>
          <td>${rate.toFixed(2)}</td>
          <td>${qty}</td>
          <td>${Number(item?.sum || 0).toFixed(2)} ${escapeHtml(currencyLabel)}</td>
        </tr>`
  }).join('')

  const paymentInfoHtml = paymentInfoLines.map((line: string, idx: number) =>
    `<div class="info-line${idx === 0 ? ' info-line-accent' : ''}">${escapeHtml(line)}</div>`
  ).join('')

  const issuedToHtml = issuedToLines.map((line: string, idx: number) =>
    `<div class="info-line${idx === 0 ? ' info-line-accent' : ''}">${escapeHtml(line)}</div>`
  ).join('')

  const bankDetailsHtml = normalizedBankDetailsLines.map((line: string) =>
    `<div class="info-line bank-line">${renderBankDetailsLineHtml(line)}</div>`
  ).join('')

  const bankCard = normalizedBankDetailsLines.length > 0 ? `
        <div class="info-card bank-details-card">
          <div class="info-list">
            ${bankDetailsHtml}
          </div>
        </div>` : ''

  const companyName = escapeHtml(data?.reciever?.companyName || '')

  return `<!DOCTYPE html>
<html lang="${isEnglish ? 'en' : 'uk'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice ${escapeHtml(modernInvoiceNumber)}</title>
    <style>
      * { font-family: Arial, Helvetica, sans-serif; box-sizing: border-box; }
      body { margin: 0; padding: 0; background: #fff; color: #1a1a1a; }

      .invoice-container {
        border-radius: 18px;
        border: 1px solid rgba(0, 0, 0, 0.12);
        padding: 2.2rem 2.4rem;
        max-width: 980px;
        margin: 0 auto;
        background: rgba(0, 0, 0, 0.01);
        font-size: 13px;
        line-height: 1.5;
      }

      /* Header */
      .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.6rem;
        padding-bottom: 0.8rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      }
      .brand-text {
        font-size: 1.35rem;
        font-weight: 700;
        color: #1a1a1a;
      }
      .brand-note {
        font-size: 17px;
        font-weight: 300;
        color: rgba(0, 0, 0, 0.65);
        display: block;
        margin-top: 0.15rem;
      }
      .invoice-header h1 {
        margin: 0;
        font-size: 2.1rem;
        letter-spacing: 0.04em;
        font-weight: 700;
        color: #1a1a1a;
      }

      /* Info cards grid */
      .invoice-info-card {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 1rem;
        align-items: start;
        margin: 0 auto 1.5rem;
      }
      .info-column-stack {
        display: grid;
        gap: 0.8rem;
      }
      .info-card {
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.02);
        padding: 1rem 1.1rem;
      }
      .top-info-card {
        min-height: 170px;
      }
      .bank-details-card {
        background: rgba(0, 0, 0, 0.015);
        border-color: rgba(0, 0, 0, 0.15);
      }
      .info-card h4 {
        margin: 0 0 0.8rem;
        font-size: 0.78rem;
        letter-spacing: 0.08em;
        color: #1a1a1a;
      }
      .info-list {
        display: grid;
        gap: 0.35rem;
      }
      .info-line {
        font-size: 1rem;
        line-height: 1.3;
        color: #1a1a1a;
        white-space: normal;
        overflow-wrap: anywhere;
      }
      .info-line-accent {
        font-weight: 700;
        font-size: large;
        letter-spacing: 0.01em;
        margin-bottom: 0.3rem;
        color: #1a1a1a;
      }
      .bank-details-label {
        font-weight: 700;
        color: #1a1a1a;
      }
      .bank-line {
        font-size: 0.9rem;
        color: rgba(0, 0, 0, 0.65);
      }

      /* Table */
      .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0.6rem;
        table-layout: fixed;
      }
      .invoice-table th,
      .invoice-table td {
        text-align: left;
        padding: 0.7rem 0.6rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.10);
        font-size: 0.95rem;
      }
      .invoice-table th {
        font-size: 0.78rem;
        letter-spacing: 0.09em;
        color: rgba(0, 0, 0, 0.55);
        padding-top: 0.9rem;
        padding-bottom: 0.9rem;
      }
      .invoice-table td { color: #1a1a1a; }
      .invoice-table th:nth-child(2),
      .invoice-table td:nth-child(2) { width: 12%; text-align: right; white-space: nowrap; }
      .invoice-table th:nth-child(3),
      .invoice-table td:nth-child(3) { width: 10%; text-align: right; white-space: nowrap; }
      .invoice-table th:nth-child(4),
      .invoice-table td:nth-child(4) { width: 18%; text-align: right; white-space: nowrap; }

      /* Summary */
      .summary-section {
        margin-top: 1.1rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1.5rem;
      }
      .invoice-dates {
        min-width: 240px;
        max-width: 360px;
        padding-top: 0.35rem;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.3rem;
        font-size: 0.95rem;
        color: #1a1a1a;
      }
      .info-row span {
        color: rgba(0, 0, 0, 0.55);
        font-size: 0.82rem;
        letter-spacing: 0.04em;
      }
      .totals-block {
        width: 360px;
        max-width: 100%;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.3rem 0;
        font-size: 0.95rem;
        color: #1a1a1a;
      }
      .grand-total {
        margin-top: 0.2rem;
        padding-top: 0.6rem;
        font-size: 1.1rem;
        font-weight: 700;
        color: #1a1a1a;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
      }
      .grand-total span { color: rgba(0, 0, 0, 0.55); }

      /* Footer */
      .footer-note {
        margin-top: 2.2rem;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.4rem;
        font-size: 0.95rem;
        color: #1a1a1a;
      }
      .signature-line {
        color: rgba(0, 0, 0, 0.55);
        font-style: italic;
        padding-top: 60px;
      }

      @media print {
        @page { size: A4; margin: 12mm 14mm; }
        body { background: #fff !important; }
        .invoice-container {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 1.8rem 2rem !important;
          background: #ffffff !important;
          border: 1px solid #d8d8d8 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
  </head>
  <body>
    <div class="invoice-container">

      <div class="invoice-header">
        <div class="brand-block">
          <div class="brand-text">
            ${companyName}
            ${monthYear ? `<span class="brand-note">${isEnglish ? 'Note:' : 'Примітка:'} ${escapeHtml(monthYear)}</span>` : ''}
          </div>
        </div>
        <h1>${isEnglish ? 'INVOICE' : 'РАХУНОК'} №${escapeHtml(modernInvoiceNumber)}</h1>
      </div>

      <div class="invoice-info-card">
        <div class="info-column-stack">
          <div class="info-card top-info-card">
            <h4>${isEnglish ? 'PAYMENT INFO:' : 'ПЛАТІЖНІ ДАНІ:'}</h4>
            <div class="info-list">
              ${paymentInfoHtml}
            </div>
          </div>
          ${bankCard}
        </div>

        <div class="info-card top-info-card">
          <h4>${isEnglish ? 'ISSUED TO:' : 'ОТРИМУВАЧ:'}</h4>
          <div class="info-list">
            ${issuedToHtml}
          </div>
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>${isEnglish ? 'DESCRIPTION' : 'ОПИС'}</th>
            <th>${isEnglish ? 'RATE' : 'ЦІНА'}</th>
            <th>${isEnglish ? 'QTY' : 'К-СТЬ'}</th>
            <th>${isEnglish ? 'TOTAL' : 'СУМА'}</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="summary-section">
        <div class="invoice-dates">
          <div class="info-row">
            <span>${isEnglish ? 'DATE:' : 'ДАТА:'}</span>
            <strong>${invoiceDate}</strong>
          </div>
          <div class="info-row">
            <span>${isEnglish ? 'DUE DATE:' : 'СТРОК ОПЛАТИ:'}</span>
            <strong>${invoiceDueDate}</strong>
          </div>
        </div>

        <div class="totals-block">
          <div class="total-row grand-total">
            <span>${isEnglish ? 'TOTAL' : 'ВСЬОГО'}</span>
            <strong>${total.toFixed(2)} ${escapeHtml(currencyLabel)}</strong>
          </div>
        </div>
      </div>

      <div class="footer-note">
        <strong>${isEnglish ? 'THANK YOU' : 'ДЯКУЄМО'}</strong>
        <div class="signature-line">______________</div>
      </div>

    </div>
  </body>
</html>`
}
