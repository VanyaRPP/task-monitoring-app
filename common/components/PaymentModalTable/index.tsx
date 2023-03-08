import { Input, Table, Button, Tooltip } from 'antd'
import { useState, useEffect, FC, ChangeEvent } from 'react'
import { ColumnProps } from 'antd/lib/table'
import moment from 'moment'
import { dataSource, ITableData } from '@utils/tableData'
import s from './style.module.scss'

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
        <>
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
        </>
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
