import dayjs from 'dayjs'
import { preparePaymentData } from '../preparePaymentData'

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(date?: string | null): string {
  if (!date) return ''
  const d = dayjs(date)
  return d.isValid() ? d.format('MM/DD/YYYY') : ''
}

function formatDueDate(date?: string | null): string {
  if (!date) return ''
  const d = dayjs(date)
  return d.isValid() ? d.add(5, 'd').format('MM/DD/YYYY') : ''
}

function getDomainHeading(data: any, fallback?: string): string {
  return (
    (typeof data?.domain === 'object' && data?.domain?.name) ||
    (fallback || '').trim() ||
    ''
  )
}

function getRecipientCompanyHeading(data: any): string {
  return (
    (data?.reciever?.companyName ||
      data?.reciever?.name ||
      (typeof data?.company === 'object' && data?.company?.companyName) ||
      data?.sender?.companyName ||
      data?.sender?.name ||
      data?.client?.companyName ||
      data?.client?.name ||
      data?.issuedTo?.companyName ||
      data?.issuedTo?.name ||
      '') as string
  ).trim()
}

export function generateOfficialHtml(data: any): string {
  const {
    rows,
    getQty,
    subtotal,
    total,
    currencyLabel,
    modernInvoiceNumber,
    domainName,
  } = preparePaymentData(data)

  const taxPercent = Number(data?.taxPercent) || 0
  const taxAmount = +(subtotal * (taxPercent / 100)).toFixed(2)
  const grandTotal = (+data?.generalSum || +data?.debit || total).toFixed(2)

  const domainLabel = getDomainHeading(data, domainName)
  const clientCompany = getRecipientCompanyHeading(data)

  const issueDate = formatDate(data?.invoiceCreationDate)
  const dueDate = formatDueDate(data?.invoiceCreationDate)

  const subjectText =
    data?.notes ||
    (dayjs(data?.invoiceCreationDate).isValid()
      ? `Services rendered for ${dayjs(data.invoiceCreationDate).locale('en').format('MMMM YYYY')}`
      : `Invoice ${modernInvoiceNumber}`)

  const tableRows = rows
    .map((item: any, index: number) => {
      const qty = getQty(item)
      const rate = Number.isFinite(Number(item?.price))
        ? Number(item.price)
        : qty
        ? Number(item?.sum || 0) / qty
        : Number(item?.sum || 0)
      const name = escapeHtml(
        item?.name || item?.description || item?.type || '—'
      )
      return `
        <tr${index % 2 === 1 ? ' class="row-alt"' : ''}>
          <td class="cell-desc">${name}</td>
          <td class="cell-num">${(qty as number)?.toFixed?.(2) ?? qty}</td>
          <td class="cell-num">${escapeHtml(currencyLabel)}&nbsp;${rate.toFixed(2)}</td>
          <td class="cell-num cell-amount">${escapeHtml(currencyLabel)}&nbsp;${Number(item?.sum || 0).toFixed(2)}</td>
        </tr>`
    })
    .join('')

  const taxBlock =
    taxPercent > 0
      ? `
        <div class="total-row">
          <span>Subtotal</span>
          <strong>${escapeHtml(currencyLabel)}&nbsp;${subtotal.toFixed(2)}</strong>
        </div>
        <div class="total-row">
          <span>VAT ${taxPercent}%</span>
          <strong>${escapeHtml(currencyLabel)}&nbsp;${taxAmount.toFixed(2)}</strong>
        </div>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice ${escapeHtml(String(modernInvoiceNumber || ''))}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        font-size: 13px;
        line-height: 1.55;
        color: #111;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .invoice {
        max-width: 960px;
        margin: 0 auto;
        padding: 2.4rem 2.6rem;
        background: #fff;
      }

      /* Header */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
      }
      .title {
        font-size: 2.4rem;
        font-weight: 900;
        letter-spacing: -0.02em;
        line-height: 1;
        text-transform: uppercase;
        color: #111;
        margin: 0;
      }
      .header-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.7rem;
        /* Pin to right edge regardless of available space — see SCSS comment. */
        margin-left: auto;
        min-width: 0;
        max-width: 30rem;
        flex: 0 0 auto;
        padding-right: 0.6rem;
      }
      .party-block {
        display: table;
        width: 100%;
      }
      .party-block .label,
      .party-block .value {
        display: table-cell;
        vertical-align: baseline;
      }
      .party-block .label {
        width: 16rem;
        font-size: 0.78rem;
        color: #888;
        text-align: right;
        padding-right: 0.9rem;
        white-space: nowrap;
      }
      .party-block .value {
        font-weight: 700;
        font-size: 1rem;
        color: #111;
        border-left: 3px solid #4a6491;
        padding-left: 0.7rem;
      }

      /* Meta */
      .meta {
        display: table;
        width: 100%;
        border-top: 1px solid #e2e2e2;
        margin-bottom: 1.6rem;
        border-collapse: collapse;
      }
      .meta-row { display: table-row; }
      .meta-row .meta-label,
      .meta-row .meta-value {
        display: table-cell;
        border-bottom: 1px solid #e2e2e2;
        padding: 0.55rem 0.9rem;
        vertical-align: middle;
      }
      .meta-row .meta-label {
        width: 130px;
        font-size: 0.8rem;
        color: #888;
        padding-left: 0;
      }
      .meta-row .meta-value {
        font-size: 0.9rem;
        font-weight: 600;
        border-left: 1px solid #e2e2e2;
      }
      .meta-row.alt .meta-label,
      .meta-row.alt .meta-value {
        background: #fafafa;
      }

      /* Items */
      .items-wrap {
        border: 1px solid #e2e2e2;
        border-radius: 4px;
        overflow: hidden;
      }
      table.items {
        width: 100%;
        border-collapse: collapse;
      }
      table.items th {
        background: #fafafa;
        font-size: 0.7rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #888;
        font-weight: 700;
        padding: 0.65rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e2e2e2;
      }
      table.items th.cell-num { text-align: right; }
      table.items td {
        font-size: 0.9rem;
        padding: 0.7rem 1rem;
        color: #111;
        border-bottom: 1px solid #e2e2e2;
      }
      table.items tr:last-child td { border-bottom: none; }
      table.items tr.row-alt td { background: #fafafa; }
      table.items td.cell-num {
        text-align: right;
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        font-size: 0.85rem;
        white-space: nowrap;
      }
      table.items td.cell-amount { font-weight: 600; }

      table.items th:nth-child(1), table.items td:nth-child(1) { width: auto; }
      table.items th:nth-child(2), table.items td:nth-child(2) { width: 10%; }
      table.items th:nth-child(3), table.items td:nth-child(3) { width: 16%; }
      table.items th:nth-child(4), table.items td:nth-child(4) { width: 18%; }

      /* Totals */
      .summary {
        display: flex;
        justify-content: flex-end;
        margin-top: 1.4rem;
      }
      .totals {
        min-width: 320px;
        border: 1px solid #e2e2e2;
        border-radius: 4px;
        overflow: hidden;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        font-size: 0.88rem;
        background: #fafafa;
        border-bottom: 1px solid #e2e2e2;
      }
      .total-row:last-child { border-bottom: none; }
      .total-row span { color: #888; font-size: 0.78rem; }
      .total-row strong {
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        color: #111;
      }
      .grand {
        background: #4a6491 !important;
        padding: 0.7rem 1rem;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .grand span {
        color: #ffffff !important;
        font-size: 0.78rem !important;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        font-weight: 800;
      }
      .grand strong {
        color: #ffffff !important;
        font-size: 1.05rem;
        font-weight: 800;
      }

      @media print {
        @page { size: A4; margin: 12mm 14mm; }
        .invoice { padding: 0 !important; max-width: none !important; }
        /* Re-assert white inside the grand-total chip in case any later rule
           bleeds through — keep the chip readable on paper. */
        .grand span,
        .grand strong { color: #ffffff !important; }
      }
    </style>
  </head>
  <body>
    <div class="invoice">
      <div class="header">
        <h1 class="title">Invoice</h1>
        <div class="header-right">
          ${
            domainLabel
              ? `<div class="party-block">
            <div class="label">From</div>
            <div class="value">${escapeHtml(domainLabel)}</div>
          </div>`
              : ''
          }
          ${
            clientCompany
              ? `<div class="party-block">
            <div class="label">Invoice For</div>
            <div class="value">${escapeHtml(clientCompany)}</div>
          </div>`
              : ''
          }
        </div>
      </div>

      <div class="meta">
        <div class="meta-row">
          <div class="meta-label">Invoice ID</div>
          <div class="meta-value">${escapeHtml(String(modernInvoiceNumber || ''))}</div>
        </div>
        <div class="meta-row alt">
          <div class="meta-label">Issue Date</div>
          <div class="meta-value">${escapeHtml(issueDate)}</div>
        </div>
        <div class="meta-row">
          <div class="meta-label">Due Date</div>
          <div class="meta-value">${escapeHtml(dueDate)} (upon receipt)</div>
        </div>
        <div class="meta-row alt">
          <div class="meta-label">Subject</div>
          <div class="meta-value">${escapeHtml(subjectText)}</div>
        </div>
      </div>

      <div class="items-wrap">
        <table class="items">
          <thead>
            <tr>
              <th>Description</th>
              <th class="cell-num">Quantity</th>
              <th class="cell-num">Unit Price</th>
              <th class="cell-num">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>

      <div class="summary">
        <div class="totals">
          ${taxBlock}
          <div class="total-row grand">
            <span>Total Due</span>
            <strong>${escapeHtml(currencyLabel)}&nbsp;${grandTotal}</strong>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`
}
