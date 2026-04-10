import React, { FC } from 'react'
import { Select, Input, Form, Row, Col } from 'antd'

const { Option } = Select

interface Props {
  domainType?: string
  onTypeChange: (value: string) => void
}

const DomainModalType: FC<Props> = ({ domainType, onTypeChange }) => {
  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={domainType === 'own' ? 8 : 24}>
        <Form.Item
          name="domainType"
          label="Тип послуг"
          preserve={true}
          style={{ marginBottom: 0 }}
        >
          <Select placeholder="Оберіть тип" onChange={onTypeChange} style={{ width: '100%' }}>
            <Option value="communal">Комунальні</Option>
            <Option value="it">IT</Option>
            <Option value="own">Власне</Option>
          </Select>
        </Form.Item>
      </Col>

      {domainType === 'own' && (
        <>
          <Col span={16}>
            <Form.Item
              name="ownServiceName"
              label="Назва Послуги"
              rules={[{ required: true, message: 'Введіть назву' }]}
              preserve={true}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="Назва" />
            </Form.Item>
          </Col>
        </>
      )}
    </Row>
  )
}

export default DomainModalType