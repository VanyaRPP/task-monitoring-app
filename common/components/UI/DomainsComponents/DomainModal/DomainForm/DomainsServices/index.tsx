import { CloseOutlined } from '@ant-design/icons'
import { Button, Card, Form, FormInstance, Input } from 'antd'
import React, { FC } from 'react'

interface Props {
  editable: boolean
}

const DomainsServices: FC<Props> = ({ editable }) => {
  return (
    <>
      <Form.List name="domainServices">
        {(fields, { add, remove }) => (
          <div style={{ display: 'flex', rowGap: 16, flexDirection: 'column' }}>
            {fields.map((field) => (
              <Card
                size="small"
                title={`Послуга ${field.name + 1}`}
                key={field.key}
                aria-disabled={!editable}
                extra={
                  <Button
                    type="link"
                    disabled={!editable}
                    onClick={() => {
                      remove(field.name)
                    }}
                  >
                    <CloseOutlined />
                  </Button>
                }
              >
                <Form.Item label="Найменування" name={[field.name, 'name']}>
                  <Input
                    placeholder="Найменування послуги"
                    disabled={!editable}
                  />
                </Form.Item>

                <Form.Item label="Ціна" name={[field.name, 'price']}>
                  <Input placeholder="Ціна послуги" disabled={!editable} />
                </Form.Item>
              </Card>
            ))}
            <Button
              disabled={!editable}
              type="dashed"
              style={{ marginBottom: 10 }}
              onClick={() => add()}
              block
            >
              + Додати послугу
            </Button>
          </div>
        )}
      </Form.List>
    </>
  )
}

export default DomainsServices
