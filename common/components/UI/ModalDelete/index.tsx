import React from 'react'
import { Modal, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface ModalDelete<T extends object> {
  open: boolean
  title?: string
  okText?: string
  cancelText?: string
  data: T[]
  columns: ColumnsType<T>
  rowKey: string | ((record: T) => string)
  onConfirm: () => Promise<void> | void
  onCancel: () => void
}

function ModalDelete<T extends object>({
  open,
  title = 'Ви впевнені, що хочете видалити обрані елементи?',
  okText = 'Так',
  cancelText = 'Ні',
  data,
  columns,
  rowKey,
  onConfirm,
  onCancel,
}: ModalDelete<T>) {
  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      cancelText={cancelText}
      onOk={onConfirm}
      onCancel={onCancel}
      width={700}
      destroyOnClose
    >
      <Table
        bordered
        size="small"
        dataSource={data}
        columns={columns}
        rowKey={rowKey}
        pagination={false}
      />
    </Modal>
  )
}

export default ModalDelete
