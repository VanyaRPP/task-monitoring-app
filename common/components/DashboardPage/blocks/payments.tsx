import React, { FC, useState } from 'react'
import { Card, Table, Button } from 'antd'
import Router from 'next/router'
import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { AppRoutes } from '@utils/constants'
import AddPaymentModal from '@common/components/AddPaymentModal'
import s from './style.module.scss'

interface Props {
  style: string
}

const dataSource = [
  // mock data
  {
    key: '1',
    date: '12.12.2023',
    name: 'test',
    debit: 200,
    credit: 500,
    description: 'natberh',
  },
  {
    key: '2',
    date: '11.12.2023',
    name: 'test',
    debit: 200,
    credit: 500,
    description: 'Olimp',
  },
  {
    key: '3',
    date: '10.11.2023',
    name: 'test',
    debit: 200,
    credit: 500,
    description: 'Somebody',
  },
]

const columns = [
  {
    title: 'Дата',
    dataIndex: 'date',
    key: 'date',
  },
  {
    title: 'Назва',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Дебет',
    dataIndex: 'debit',
    key: 'debit',
  },
  {
    title: 'Кредит',
    dataIndex: 'credit',
    key: 'credit',
  },
  {
    title: 'Опис',
    dataIndex: 'description',
    key: 'description',
    width: '20%',
  },
]

const PaymentsBlock: FC<Props> = ({ style }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const closeModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <AddPaymentModal isModalOpen={isModalOpen} closeModal={closeModal} />
      <Card
        className={style}
        title={
          <div className={s.TableHeader}>
            <Button type="link" onClick={() => Router.push(AppRoutes.PAYMENT)}>
              Проплати
              <SelectOutlined className={s.Icon} />
            </Button>
            <Button type="link" onClick={() => setIsModalOpen(true)}>
              <PlusOutlined /> Додати оплату
            </Button>
          </div>
        }
        style={{ flex: '1.5' }}
      >
        <Table
          className={s.Table}
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          bordered
          summary={(pageData) => {
            let totalCredit = 0
            let totalDebit = 0

            pageData.forEach(({ credit, debit }) => {
              totalCredit += credit
              totalDebit += debit
            })

            return (
              <>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>Всього:</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}></Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <p style={{ color: 'red' }}>{totalDebit}</p>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <p style={{ color: 'red' }}>{totalCredit}</p>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </>
            )
          }}
        />
      </Card>
    </>
  )
}

export default PaymentsBlock
