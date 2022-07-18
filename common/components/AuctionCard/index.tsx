import { useState, useEffect } from 'react'
import { Card, Table, Input, Button, Form } from 'antd'
import useDebounce from 'common/assets/hooks/useDebounce'
import s from './style.module.scss'

import { auction as config } from 'common/lib/task.config'
import ModalWindow from '../UI/ModalWindow/index'
import ApplyAuctionForm from '../ApplyAuctionForm/index'

const AuctionCard = ({ taskId }) => {
  const [data, setData] = useState(config)
  const [search, setSearch] = useState({ name: '', address: '' })
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)
  const debounced = useDebounce<{ name: string; address: string }>(search)

  const [form] = Form.useForm()

  const onCancelModal = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const onSubmiModal = async () => {
    const formData = await form.validateFields()
    setIsFormDisabled(true)
    // await addCategory({ ...formData })
    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }

  useEffect(() => {
    setData(
      config.filter((item) =>
        item.name.toLowerCase().includes(debounced.name.toLowerCase())
      )
    )
  }, [debounced])

  const searchInput = (order: string) => (
    <Input
      placeholder={order.charAt(0).toUpperCase() + order.slice(1)}
      value={search[order]}
      onChange={(e) => setSearch({ ...search, [order]: e.target.value })}
    />
  )

  const columns = [
    {
      title: searchInput('name'),
      dataIndex: 'name',
      key: 'name',
      width: '70%',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: '15%',
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: '15%',
      sorter: (a, b) => a.rating - b.rating,
    },
  ]

  return (
    <Card
      className={`${s.Card} ${s.Auction}`}
      title={`Auction: ${config.length}`}
      extra={
        <Button type="primary" ghost onClick={() => setIsModalVisible(true)}>
          Apply
        </Button>
      }
    >
      <ModalWindow
        title="Apply for an auction"
        isModalVisible={isModalVisible}
        onCancel={onCancelModal}
        onOk={onSubmiModal}
        okText="Apply"
        cancelText="Cancel"
      >
        <ApplyAuctionForm isFormDisabled={isFormDisabled} form={form} />
      </ModalWindow>
      <Table dataSource={data} columns={columns} pagination={false} />
    </Card>
  )
}

export default AuctionCard
