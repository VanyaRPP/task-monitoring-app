import React, {CSSProperties, useEffect, useState} from 'react';
import {DataType} from "csstype";
import {ColumnsType} from "antd/es/table";
import {Form, Table} from "antd";
import styles from "./styles.module.scss"
import {data} from "./data"
import {usePaymentData} from "@common/modules/hooks/usePaymentData";
import {getInvoices} from "@utils/getInvoices";
import {useGetAllPaymentsQuery} from "@common/api/paymentApi/payment.api";
import {IPayment, IPaymentField} from "@common/api/paymentApi/payment.api.types";
import {ServiceType} from "@utils/constants";

interface InvoicesTableData extends IPaymentField {
  number: number,
  unit: string;
}


const columns: ColumnsType<InvoicesTableData> = [
  {
    title: '№',
    dataIndex: 'number',
    key: 'number',
  },
  {
    title: 'Найменування робіт, послуг',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: 'Кіль-сть',
    dataIndex: 'amount',
    key: 'amount',
  },
  {
    title: 'Од.',
    dataIndex: 'unit',
    key: 'unit',
  },
  {
    title: 'Ціна з ПДВ',
    dataIndex: 'price',
    key: 'price',
  },
  {
    title: 'Сума з ПДВ',
    dataIndex: 'sum',
    key: 'sum',
  },
];

const units: string[] = ["", "один", "два", "три", "чотири", "п'ять", "шість", "сім", "вісім", "дев'ять"];
const teens: string[] = ["", "одинадцять", "дванадцять", "тринадцять", "чотирнадцять", "п'ятнадцять", "шістнадцять", "сімнадцять", "вісімнадцять", "дев'ятнадцять"];
const tens: string[] = ["", "десять", "двадцять", "тридцять", "сорок", "п'ятдесят", "шістдесят", "сімдесят", "вісімдесят", "дев'яносто"];
const hundreds: string[] = ["", "сто", "двісті", "триста", "чотириста", "п'ятсот", "шістсот", "сімсот", "вісімсот", "дев'ятсот"];
const thousands: string[] = ["", "тисяча", "тисячі", "тисяч"];
const millions: string[] = ["", "мільйон", "мільйони", "мільйонів"];

function numberToWords(num: number): string {
  if (num === 0) return "нуль";

  function getUnitsWord(n: number, words: string[]): string {
    if (n % 10 === 1 && n % 100 !== 11) return words[0];
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return words[1];
    return words[2];
  }

  function convertToWords(n: number): string {
    if (n < 10) return units[n];
    if (n > 10 && n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 === 0 ? "" : " " + units[n % 10]);
    if (n < 1000) {
      const remainder = n % 100;
      if (remainder === 0) return hundreds[Math.floor(n / 100)];
      if (remainder < 10) return hundreds[Math.floor(n / 100)] + " " + units[remainder];
      if (remainder > 10 && remainder < 20) return hundreds[Math.floor(n / 100)] + " " + teens[remainder - 10];
      return hundreds[Math.floor(n / 100)] + " " + tens[Math.floor(remainder / 10)] + (remainder % 10 === 0 ? "" : " " + units[remainder % 10]);
    }
    return "";
  }

  let result = "";
  const millionPart = Math.floor(num / 1000000);
  const thousandPart = Math.floor((num % 1000000) / 1000);
  const remainderPart = num % 1000;

  if (millionPart > 0) {
    result += convertToWords(millionPart) + " " + getUnitsWord(millionPart, millions) + " ";
  }

  if (thousandPart > 0) {
    result += convertToWords(thousandPart) + " " + getUnitsWord(thousandPart, thousands) + " ";
  }

  if (remainderPart > 0) {
    result += convertToWords(remainderPart);
  }

  return result.trim();
}


const PriceList = () => {
  const [payment, setPayment] = useState(data[0])
  const [totalSum, setTotalSum] = useState(0)
  const [totalIntSumWords, setTotalIntSumWords] = useState(numberToWords(0))
  const [totalFractionSumWords, setTotalFractionSumWords] = useState(numberToWords(0))


  const getModifiedInvoices = () => {
    return payment.invoice.map((item, index) => ({
      ...item, unit: "грн", number: index + 1
    } as InvoicesTableData))
  }

  useEffect(() => {
    setTotalSum(payment.invoice.reduce((acc, item, index) => {
      acc += Number(item.sum)
      return acc
    }, 0))
  }, [payment]);

  useEffect(() => {
    const numberStr = totalSum.toFixed(2).toString()
    const numbersSplit = numberStr.split('.')
    setTotalIntSumWords(numberToWords(Number(numbersSplit[0])))
    setTotalFractionSumWords(numberToWords(numbersSplit.length > 1 ? Number(numbersSplit[1]) : 0))
  }, [totalSum]);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.approvalSection}>
            <div>
              ЗАТВЕРДЖУЮ<br/>
              {payment.provider.description}
              <br/>
              <br/>
              <hr/>
            </div>
          </div>
          <div className={styles.approvalSection}>
            <div>
              ЗАТВЕРДЖУЮ<br/>
              {payment.reciever.description}
              <br/>
              <br/>
              <hr/>
            </div>
          </div>
        </div>
        <div className={styles.titleSection}>
          <h1><b>АКТ надання послуг</b></h1>
          <p><b>№ 32 від 29 березня 2024 р.</b></p>
          <hr/>
        </div>
        <div className={styles.contentSection}>
          <p>
            Ми, що нижче підписалися, представник Замовника {payment.reciever.description}, з одного
            боку, і представник Виконавця {payment.provider.description},
            з іншого боку, склали цей акт про те, що на підставі наведених документів:
          </p>
          <p>Договір:</p>
          <p>Виконавцем були виконані наступні роботи (надані такі послуги):</p>
        </div>
      </div>


      <Table
        columns={columns}
        dataSource={getModifiedInvoices()}
        pagination={false}
        summary={() => {
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>Всього:</Table.Summary.Cell>
              <Table.Summary.Cell index={1}>{totalSum.toFixed(2)}</Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />


      <div className={styles.container}>
        <div className={styles.contentSection}>
          <div>
            Загальна вартість робіт (послуг) склала без ПДВ {totalIntSumWords} гривень {totalFractionSumWords} копійок, ПДВ
            Нуль гривень 00 копійок, загальна вартість робіт (послуг) із
            ПДВ {totalIntSumWords} гривень {totalFractionSumWords} копійок.
            <br/>
            Замовник претензій по об&apos;єму, якості та строкам виконання робіт (надання послуг) не має.
          </div>
        </div>
        <hr/>
        <br/><br/>
        <div className={styles.signaturesSection}>
          <div className={styles.signatureBlock}>
            <div>
              <b>Від Виконавця*</b><br/>
              <br/>
              <hr/>
              <b>{payment.invoiceCreationDate.toLocaleDateString()}</b> <br/>
              <pre>{payment.provider.description} <br/></pre>
            </div>
          </div>
          <div className={styles.signatureBlock}>
            <div>
              <b>Від Замовника</b> <br/>
              <br/>
              <hr/>
              <b>{payment.invoiceCreationDate.toLocaleDateString()}</b> <br/>
              <pre>{payment.reciever.description}</pre>
            </div>
          </div>
        </div>
      </div>
    </>

  );
};


export default PriceList;