import { Input, Table, Button, Tooltip } from 'antd'
import { useState, useEffect, FC, ChangeEvent } from 'react'
import { ColumnProps } from 'antd/lib/table'
import moment from 'moment'
import s from './style.module.scss'

interface ITableData {
  id: string
  name: string
  lastAmount?: number
  amount: number
  price: number
  sum?: number
}

const dataSource: ITableData[] = [
  {
    id: '1',
    name: 'Утримання',
    amount: 0,
    price: 0,
  },
  {
    id: '2',
    name: 'Розміщення',
    amount: 0,
    price: 0,
  },
  {
    id: '3',
    name: 'Електропостачання',
    lastAmount: 0,
    amount: 0,
    price: 0,
  },
  {
    id: '4',
    name: 'Водопостачання',
    lastAmount: 0,
    amount: 0,
    price: 0,
  },
]

const PaymentModalTable: FC = () => {
  const [tableData, setTableData] = useState(dataSource)

  // useEffect(() => { TODO: set total after first render
  //   const newData = [...tableData]
  //   for (let index = 0; index < tableData.length; index++) {
  //     setTotal(newData, index)
  //   }
  //   setTableData(newData)
  // }, [])

  const onInputChange = (key, index) => (e: ChangeEvent<HTMLInputElement>) => {
    const newData = [...tableData]
    newData[index][key] = Number(e.target.value)
    setTotal(newData, index)
    setTableData(newData)
  }

  const setTotal = (data, index) => {
    if (data[index]['lastAmount']) {
      data[index]['sum'] = Number(
        (data[index]['lastAmount'] - data[index]['amount']) *
          data[index]['price']
      )
    } else {
      data[index]['sum'] = Number(data[index]['amount'] * data[index]['price'])
    }
  }

  const onConfirm = () => {
    console.log(tableData)
  }

  const columns: ColumnProps<ITableData>[] = [
    {
      title: '№',
      dataIndex: 'id',
      width: 50,
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      render: (name) => (
        <Tooltip title={`${name} (${moment().format('MMMM')})`}>
          <span className={s.rowText}>
            {name} <span className={s.month}>({moment().format('MMMM')})</span>
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'К-сть',
      dataIndex: 'amount',
      render: (text, record, index) => (
        <Tooltip title={text}>
          {record.name === 'Електропостачання' ||
          record.name === 'Водопостачання' ? (
            <div className={s.doubleInputs}>
              {/* value={text} */}
              <Input onChange={onInputChange('lastAmount', index)} />
              -
              <Input onChange={onInputChange('amount', index)} />
            </div>
          ) : (
            <Input onChange={onInputChange('amount', index)} />
          )}
        </Tooltip>
      ),
    },
    {
      title: 'Ціна',
      dataIndex: 'price',
      render: (text, record, index) => (
        <Tooltip title={text}>
          <Input onChange={onInputChange('price', index)} />
        </Tooltip>
      ),
    },
    {
      title: 'Сума',
      dataIndex: 'sum',
      render: (text, record, index) => <h4>{text}</h4>,
      width: 80,
    },
  ]

  return (
    <>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={tableData}
        pagination={false}
      />
      <Button type="primary" onClick={onConfirm}>
        Get data
      </Button>
    </>
  )
}

export default PaymentModalTable
