import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import dayjs from 'dayjs'
import { ServiceType } from '../constants'
import { renderCurrency } from '../helpers'
import nameField from './nameFieldGenerator'

const sharedStyles = `
  * { font-family: Arial, Helvetica, sans-serif; }
  body { margin: 0; padding: 0; display: flex; justify-content: center; min-height: 100vh; }
  .invoice-wrapper { padding: 2rem; max-width: 800px; width: 100%; box-sizing: border-box; }
  .detailed-list .detailed-list__item { display: flex; margin-bottom: 1rem; }
  .detailed-list .detailed-list__item .detailed-list__key { min-width: 150px; }
  .invoice-title { text-align: center; }
  .summary { margin-top: 1rem; }
  .muted { color: #868686; }
  .pos { padding: 0; vertical-align: top; border: white; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  table td { padding: 1.5ex; border-bottom: 1px solid #ececec; }
  table th { padding: 1rem 0.5rem; text-align: left; background-color: #fafafa; border-bottom: 1px solid #ececec; }
`

function buildHeader(paymentData: any): string {
  return `
    <div class="detailed-list">
      <div class="detailed-list__item">
        <div class="detailed-list__key">Постачальник</div>
        <div class="detailed-list__value">
          ${(paymentData?.provider?.description || '').replace(/\n/g, '<br />')}
        </div>
      </div>
      <div class="detailed-list__item">
        <div class="detailed-list__key">Одержувач</div>
        <div class="detailed-list__value pos">
          ${paymentData?.reciever?.companyName || ''} <br />
          ${(paymentData?.reciever?.description || '').replace(/\n/g, '<br />')} <br />
          ${(paymentData?.reciever?.adminEmails || []).map((email) => `<div>${email}</div>`).join('')}
        </div>
      </div>
    </div>
    <div class="invoice-title">
      <h1>РАХУНОК № ${paymentData.invoiceNumber}</h1>
      <b>Від ${dayjs(paymentData?.invoiceCreationDate)?.format?.('DD.MM.YYYY')} року.</b>
      <p>Підлягає сплаті до ${dayjs(paymentData?.invoiceCreationDate).add(5, 'd').format('DD.MM.YYYY')} року</p>
    </div>
  `
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

  const dataToMap = paymentData?.invoice
  const dataForTable = await generateDataForTable(dataToMap, paymentData)
  const htmlRows = dataForTable
    .map(
      (item) => `
    <tr>
      <td>${item.id}</td>
      <td>${item.Name}</td>
      <td>${item.Quantity}</td>
      <td>${renderCurrency(item.Price)}</td>
      <td>${renderCurrency(item.Amount)}</td>
    </tr>`
    )
    .join('')

  return `
  <!DOCTYPE html>
  <html lang="uk">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Invoice</title>
      <style>${sharedStyles}</style>
    </head>
    <body>
      <div class="invoice-wrapper">
        <div class="heading">${buildHeader(paymentData)}</div>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Назва</th>
              <th>Кількість</th>
              <th>Ціна</th>
              <th>Сума</th>
            </tr>
          </thead>
          <tbody>${htmlRows}</tbody>
        </table>
        <div class="summary">
          <div>Загальна сума до оплати: <b>${paymentData?.generalSum || paymentData?.debit} грн</b></div>
          <div>${paymentData?.provider?.description?.split('\n')?.[0] || ''}&nbsp; ________________</div>
        </div>
      </div>
    </body>
  </html>`
}

{
  /* <div class="note">   // deleted text
  <div class="note__title">
    <p><b>Примітка:</b></p>
  </div>
  <div class="note__description">
    <p>*Ціна за комунальні послуги вказана з урахуванням ПДВ.</p>
    <p>
      ** Ціни на комунальні послуги виставляють компанії-постачальники,
      відповідно їх ціна може змінюватись у будь-який час в
      односторонньму порядку компанією-постачальником.
    </p>
  </div>
</div> */
}

async function generateDataForTable(dataToMap, paymentData) {
  const promises = dataToMap
    ?.filter((item) =>
      item.type === ServiceType.Inflicion
        ? paymentData?.company?.inflicion || !paymentData
        : true
    )
    .map(async (item, index) => {
      const itemName =
        item?.type === ServiceType.Custom ? item?.name : item?.type
      const Quantity = item.lastAmount
        ? (item.amount - item.lastAmount)?.toFixed(2) || ''
        : item.amount || ''
      const Price = +item.price
      const Amount = +item.sum

      const Name = await nameField(itemName, paymentData)

      return {
        id: index + 1,
        Quantity,
        Price,
        Amount,
        Name,
      }
    })

  const dataForTable = await Promise.all(promises)
  return dataForTable
}
