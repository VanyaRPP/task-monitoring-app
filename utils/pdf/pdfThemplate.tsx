import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import moment from 'moment'
import { renderCurrency } from '../helpers'
import { ServiceType } from '../constants'
import nameField from './nameFieldGenerator'

export async function generateHtmlFromThemplate(
  paymentData: IExtendedPayment | any
) {
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
      <style>
        * {
          font-family: Arial, Helvetica, sans-serif;
        }

        body {
          margin: 0;
          padding: 0;
          size: A4;
          display: flex;
          justify-content: center;
          min-height: 100vh;
        }
  
        .invoice-wrapper {
          padding: 2rem;
          max-width: 800px;
          width: 100%;
          box-sizing: border-box;
        }
  
        .detailed-list .detailed-list__item {
          display: flex;
          margin-bottom: 1rem;
        }
  
        .detailed-list .detailed-list__item .detailed-list__key {
          min-width: 150px;
        }
  
        .invoice-title {
          text-align: center;
        }
  
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
  
        table td {
          padding: 1.5ex;
          border-bottom: 1px solid #ececec;
        }
  
        table th {
          padding: 1rem 0.5rem;
          position: relative;
          text-align: left;
          background-color: #fafafa;
          border-bottom: 1px solid #ececec;
        }
  
        .summary {
          margin-top: 1rem;
        }
  
        .note {
          display: flex;
          margin-top: 1rem;
        }
  
        .note .note__description {
          margin-left: 1rem;
        }
  
        .muted {
          color: #868686;
        }

        .pos {
          padding: 0;
          vertical-align: top;
          border: white;
        }
      </style>
    </head>
  
    <body>
      <div class="invoice-wrapper">
        <div class="heading">
          <div class="detailed-list">
            <div class="detailed-list__item">
              <div class="detailed-list__key">Постачальник</div>
              <div class="detailed-list__value">
                ${paymentData?.provider?.description.replace(/\n/g, '<br />')}
              </div>
            </div>
            <div class="detailed-list__item">
              <div class="detailed-list__key">Одержувач</div>
              <div class="detailed-list__value pos">
                ${paymentData?.reciever?.description.replace(
                  /\n/g,
                  '<br />'
                )} <br />
                ${paymentData?.reciever?.companyName} <br />
                ${paymentData?.reciever?.adminEmails
                  ?.map((email) => `<div>${email}</div><br />`)
                  .join('')}
              </div>
            </div>
          </div>
  
          <div class="invoice-title">
            <h1>INVOICE № INV-${paymentData.invoiceNumber}</h1>
            <b>Від ${moment(paymentData?.invoiceCreationDate)?.format?.(
              'DD.MM.YYYY'
            )} року.</b>
            <p>Підлягає сплаті до ${moment(paymentData?.invoiceCreationDate)
              .add(5, 'd')
              .format('DD.MM.YYYY')} року</p>
          </div>
        </div>
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
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
        <div class="summary">
          <div>Загальна сума до оплати: <b>${
            paymentData?.generalSum || paymentData?.debit
          } грн</b></div>
          <div>${
            paymentData?.provider?.description?.split('\n')?.[0] || ''
          }&nbsp; ________________</div>
          <div class="note">
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
          </div>
        </div>
      </div>
    </body>
  </html>
  `
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
