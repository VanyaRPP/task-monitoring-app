import dayjs from 'dayjs'
import { preparePaymentData } from '../preparePaymentData'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function generateLedgerHtml(data: any): string {
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

  const grandTotal = (+data?.generalSum || +data?.debit || total).toFixed(2)
  const companyName = escapeHtml(data?.reciever?.companyName || 'OLIMP DIGITAL OÜ')
  const providerFirstLine = escapeHtml(data?.provider?.description?.split('\n')?.[0] || '')

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
            <td>${Number(item?.sum || 0).toFixed(2)}&nbsp;${escapeHtml(currencyLabel)}</td>
          </tr>`
  }).join('')

  const providerLinesHtml = paymentInfoLines.map((line: string, idx: number) =>
    `<div class="${idx === 0 ? 'lg-party-name' : 'lg-party-line'}">${escapeHtml(line)}</div>`
  ).join('')

  const bankSectionHtml = normalizedBankDetailsLines.length > 0
    ? `<div class="lg-bank-section">
          ${normalizedBankDetailsLines.map((line: string) => {
            const sep = line.indexOf(':')
            if (sep < 0) {
              return `<div class="lg-bank-line">${escapeHtml(line)}</div>`
            }
            const label = escapeHtml(line.slice(0, sep + 1))
            const value = escapeHtml(line.slice(sep + 1))
            return `<div class="lg-bank-line"><span class="lg-bank-line-label">${label}</span>${value}</div>`
          }).join('')}
        </div>`
    : ''

  const customerLinesHtml = issuedToLines.map((line: string, idx: number) =>
    `<div class="${idx === 0 ? 'lg-party-name' : 'lg-party-line'}">${escapeHtml(line)}</div>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="${isEnglish ? 'en' : 'uk'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice ${escapeHtml(modernInvoiceNumber)}</title>
    <style>
      * { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; box-sizing: border-box; }
      body { margin: 0; padding: 0; background: #fff; color: #1a1a1a; }

      .lg-invoice {
        font-size: 13px;
        line-height: 1.5;
        max-width: 960px;
        margin: 0 auto;
        padding: 2.6rem 3rem;
        border: 1px solid rgba(0, 0, 0, 0.14);
        border-top: 4px solid #444;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.01);
      }

      /* Header */
      .lg-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.8rem;
        padding-bottom: 1.4rem;
        border-bottom: 2px solid rgba(0, 0, 0, 0.22);
      }
      .lg-brand { display: flex; flex-direction: column; gap: 0.15rem; }
      .lg-brand-name {
        font-size: 1.25rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        line-height: 1.15;
        color: #1a1a1a;
      }
      .lg-brand-sub {
        font-size: 0.65rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(0, 0, 0, 0.50);
        font-weight: 500;
      }
      .lg-invoice-title {
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.2rem;
      }
      .lg-doc-type {
        font-size: 0.6rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(0, 0, 0, 0.50);
        background: rgba(0, 0, 0, 0.035);
        padding: 0.2em 0.7em;
        border-radius: 3px;
        border: 1px solid rgba(0, 0, 0, 0.08);
      }
      .lg-invoice-number {
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        line-height: 1.1;
        color: #1a1a1a;
      }

      /* Meta row */
      .lg-meta {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        border: 1px solid rgba(0, 0, 0, 0.14);
        border-radius: 4px;
        margin-bottom: 1.8rem;
        overflow: hidden;
      }
      .lg-meta-cell {
        padding: 0.65rem 1rem;
        border-right: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(0, 0, 0, 0.035);
      }
      .lg-meta-cell:last-child { border-right: none; }
      .lg-meta-cell-label {
        font-size: 0.58rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: rgba(0, 0, 0, 0.50);
        font-weight: 600;
        margin-bottom: 0.15rem;
      }
      .lg-meta-cell-value {
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        font-size: 0.85rem;
        font-weight: 600;
        color: #1a1a1a;
      }

      /* Parties */
      .lg-parties {
        display: grid;
        grid-template-columns: 1.15fr 1fr;
        gap: 1.2rem;
        margin-bottom: 2rem;
      }
      .lg-party-box {
        border: 1px solid rgba(0, 0, 0, 0.14);
        border-radius: 4px;
        overflow: hidden;
      }
      .lg-party-header {
        font-size: 0.58rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-weight: 700;
        color: rgba(0, 0, 0, 0.50);
        background: rgba(0, 0, 0, 0.035);
        padding: 0.45rem 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      }
      .lg-party-body {
        padding: 0.9rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
      }
      .lg-party-name {
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.25;
        color: #1a1a1a;
      }
      .lg-party-line {
        font-size: 0.82rem;
        color: rgba(0, 0, 0, 0.55);
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .lg-bank-section {
        margin-top: 0.6rem;
        padding-top: 0.6rem;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .lg-bank-line {
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        font-size: 0.75rem;
        color: rgba(0, 0, 0, 0.55);
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .lg-bank-line-label {
        color: #1a1a1a;
        font-weight: 700;
      }

      /* Table */
      .lg-table-wrap {
        border: 1px solid rgba(0, 0, 0, 0.14);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0;
      }
      .lg-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      .lg-table thead { background: rgba(0, 0, 0, 0.035); }
      .lg-table thead th {
        font-size: 0.6rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: rgba(0, 0, 0, 0.50);
        font-weight: 700;
        padding: 0.7rem 1rem;
        text-align: left;
        border-bottom: 2px solid rgba(0, 0, 0, 0.22);
      }
      .lg-table tbody tr:nth-child(even) { background: rgba(0, 0, 0, 0.02); }
      .lg-table tbody td {
        font-size: 0.88rem;
        padding: 0.7rem 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        vertical-align: middle;
        color: #1a1a1a;
      }
      .lg-table tbody tr:last-child td { border-bottom: none; }
      .lg-table th:nth-child(2), .lg-table td:nth-child(2) {
        width: 14%; text-align: right; white-space: nowrap;
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        font-size: 0.82rem;
      }
      .lg-table th:nth-child(3), .lg-table td:nth-child(3) {
        width: 9%; text-align: right; white-space: nowrap;
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        font-size: 0.82rem;
      }
      .lg-table th:nth-child(4), .lg-table td:nth-child(4) {
        width: 20%; text-align: right; white-space: nowrap;
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        font-size: 0.82rem;
        font-weight: 600;
      }

      /* Summary */
      .lg-summary {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1.2rem;
        margin-top: 1.6rem;
      }
      .lg-dates {
        border: 1px solid rgba(0, 0, 0, 0.14);
        border-radius: 4px;
        overflow: hidden;
        min-width: 220px;
      }
      .lg-dates-header {
        font-size: 0.58rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-weight: 700;
        color: rgba(0, 0, 0, 0.50);
        background: rgba(0, 0, 0, 0.035);
        padding: 0.4rem 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      }
      .lg-dates-body {
        padding: 0.6rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .lg-date-row {
        display: flex;
        justify-content: space-between;
        gap: 1.5rem;
        font-size: 0.82rem;
        color: #1a1a1a;
      }
      .lg-date-row span {
        font-size: 0.65rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(0, 0, 0, 0.50);
      }
      .lg-date-row strong {
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        font-variant-numeric: tabular-nums;
        font-weight: 600;
        color: #1a1a1a;
      }
      .lg-totals-box {
        border: 1px solid rgba(0, 0, 0, 0.22);
        border-radius: 4px;
        min-width: 280px;
        overflow: hidden;
      }
      .lg-totals-header {
        font-size: 0.58rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-weight: 700;
        color: rgba(0, 0, 0, 0.50);
        background: rgba(0, 0, 0, 0.035);
        padding: 0.4rem 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      }
      .lg-totals-body {
        padding: 0.6rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .lg-total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.28rem 0;
        font-size: 0.83rem;
        color: rgba(0, 0, 0, 0.55);
      }
      .lg-total-row span { font-size: 0.75rem; letter-spacing: 0.05em; }
      .lg-total-row strong {
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        color: #1a1a1a;
      }
      .lg-grand-total {
        margin-top: 0.4rem;
        padding-top: 0.55rem;
        border-top: 1px solid rgba(0, 0, 0, 0.22);
        color: #1a1a1a;
        font-size: 1.1rem;
      }
      .lg-grand-total span {
        font-size: 0.65rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        font-weight: 700;
        color: #444;
      }
      .lg-grand-total strong {
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        font-size: 1.15rem;
        font-weight: 700;
        color: #1a1a1a;
      }

      /* Footer */
      .lg-footer {
        margin-top: 2.4rem;
        padding-top: 1.2rem;
        border-top: 2px solid rgba(0, 0, 0, 0.22);
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 2rem;
      }
      .lg-footer-note {
        font-size: 0.7rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(0, 0, 0, 0.50);
      }
      .lg-signature-block {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.2rem;
      }
      .lg-signature-line {
        font-size: 0.75rem;
        color: rgba(0, 0, 0, 0.40);
        padding-top: 52px;
        letter-spacing: 0.08em;
      }
      .lg-signature-caption {
        font-size: 0.62rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(0, 0, 0, 0.40);
      }

      @media print {
        @page { size: A4; margin: 12mm 14mm; }
        body { background: #fff !important; }
        .lg-invoice {
          max-width: none !important;
          width: 100% !important;
          padding: 2rem 2.4rem !important;
          margin: 0 !important;
          border: 1px solid #ccc !important;
          border-top: 4px solid #444 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .lg-meta { grid-template-columns: repeat(4, 1fr) !important; }
        .lg-parties { grid-template-columns: 1.15fr 1fr !important; }
        .lg-summary { flex-direction: row !important; justify-content: space-between !important; }
      }
    </style>
  </head>
  <body>
    <div class="lg-invoice">

      <div class="lg-header">
        <div class="lg-brand">
          <div class="lg-brand-name">${companyName}</div>
          <div class="lg-brand-sub">Digital Services</div>
        </div>
        <div class="lg-invoice-title">
          <div class="lg-doc-type">${isEnglish ? 'Invoice' : 'Рахунок'}</div>
          <div class="lg-invoice-number">№ ${escapeHtml(modernInvoiceNumber)}</div>
        </div>
      </div>

      <div class="lg-meta">
        <div class="lg-meta-cell">
          <div class="lg-meta-cell-label">${isEnglish ? 'Issue date' : 'Дата'}</div>
          <div class="lg-meta-cell-value">${invoiceDate}</div>
        </div>
        <div class="lg-meta-cell">
          <div class="lg-meta-cell-label">${isEnglish ? 'Due date' : 'Строк оплати'}</div>
          <div class="lg-meta-cell-value">${invoiceDueDate}</div>
        </div>
        <div class="lg-meta-cell">
          <div class="lg-meta-cell-label">${isEnglish ? 'Invoice №' : 'Рахунок №'}</div>
          <div class="lg-meta-cell-value">${escapeHtml(modernInvoiceNumber)}</div>
        </div>
        <div class="lg-meta-cell">
          <div class="lg-meta-cell-label">${isEnglish ? 'Currency' : 'Валюта'}</div>
          <div class="lg-meta-cell-value">${escapeHtml(currencyLabel)}</div>
        </div>
      </div>

      <div class="lg-parties">
        <div class="lg-party-box">
          <div class="lg-party-header">${isEnglish ? 'Provider (Contractor)' : 'Підрядник'}</div>
          <div class="lg-party-body">
            ${providerLinesHtml}
            ${bankSectionHtml}
          </div>
        </div>
        <div class="lg-party-box">
          <div class="lg-party-header">${isEnglish ? 'Customer (Recipient)' : 'Замовник'}</div>
          <div class="lg-party-body">
            ${customerLinesHtml}
          </div>
        </div>
      </div>

      <div class="lg-table-wrap">
        <table class="lg-table">
          <thead>
            <tr>
              <th>${isEnglish ? 'Description' : 'Опис'}</th>
              <th>${isEnglish ? 'Rate' : 'Ціна'}</th>
              <th>${isEnglish ? 'Qty' : 'К-сть'}</th>
              <th>${isEnglish ? 'Total' : 'Сума'}</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>

      <div class="lg-summary">
        <div class="lg-dates">
          <div class="lg-dates-header">${isEnglish ? 'Dates' : 'Дати'}</div>
          <div class="lg-dates-body">
            <div class="lg-date-row">
              <span>${isEnglish ? 'Issued' : 'Дата'}</span>
              <strong>${invoiceDate}</strong>
            </div>
            <div class="lg-date-row">
              <span>${isEnglish ? 'Due' : 'Строк'}</span>
              <strong>${invoiceDueDate}</strong>
            </div>
          </div>
        </div>

        <div class="lg-totals-box">
          <div class="lg-totals-header">${isEnglish ? 'Summary' : 'Підсумок'}</div>
          <div class="lg-totals-body">
            <div class="lg-total-row lg-grand-total">
              <span>${isEnglish ? 'Total due' : 'До сплати'}</span>
              <strong>${grandTotal}&nbsp;${escapeHtml(currencyLabel)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="lg-footer">
        <div class="lg-footer-note">${isEnglish ? 'Thank you for your business' : 'Дякуємо за співпрацю'}</div>
        <div class="lg-signature-block">
          <div class="lg-signature-line">______________</div>
          <div class="lg-signature-caption">${providerFirstLine}</div>
        </div>
      </div>

    </div>
  </body>
</html>`
}
