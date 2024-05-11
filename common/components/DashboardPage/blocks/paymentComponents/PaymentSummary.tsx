import React, {FC, useEffect} from 'react';
import {AppRoutes, Operations, Roles} from "@utils/constants";
import {Table} from "antd";
import s from "@components/DashboardPage/blocks/style.module.scss";
import {IGetPaymentResponse} from "@common/api/paymentApi/payment.api.types";
import {IUser} from "@common/modules/models/User";

interface Props {
  path: string,
  payments: IGetPaymentResponse,
  columns: any,
  currUser: IUser
}

const PaymentSummary: FC<Props> = ({path, payments, columns, currUser}) => {


  return (
    path === AppRoutes.PAYMENT &&
    payments?.data && (
      <Table.Summary fixed>
        <Table.Summary.Row className={s.summ_item}>
          {
            columns.map((item, index) => {
              let dataindex
              currUser?.roles?.includes(Roles.GLOBAL_ADMIN)
                ? dataindex = columns[index - 1]?.dataIndex
                : dataindex = item.dataIndex
              return (
                <Table.Summary.Cell
                  index={0}
                  key={item.dataIndex}
                  colSpan={item.dataIndex === '' ? 2 : 1}
                >
                  {dataindex === Operations.Debit
                    ? payments?.totalPayments?.debit?.toFixed(2) || 0
                    : ''}
                  {dataindex === Operations.Credit
                    ? payments?.totalPayments?.credit?.toFixed(2) || 0
                    : ''}
                </Table.Summary.Cell>
              )
            })}
        </Table.Summary.Row>
        <Table.Summary.Row className={s.saldo}>
          {columns.slice(0, columns.length - 1).map((item, index) => {
            let dataindex
            currUser?.roles?.includes(Roles.GLOBAL_ADMIN)
              ? dataindex = columns[index - 1]?.dataIndex
              : dataindex = item.dataIndex
            return (<Table.Summary.Cell
              colSpan={item.dataIndex === Operations.Debit ? 2 : 1}
              index={0}
              key={item.dataIndex}
            >
              {dataindex === Operations.Debit
                ? (
                  (payments?.totalPayments?.debit || 0) -
                  (payments?.totalPayments?.credit || 0)
                )?.toFixed(2)
                : false}
            </Table.Summary.Cell>)

          })}
        </Table.Summary.Row>
      </Table.Summary>
    )
  )
};

export default PaymentSummary;