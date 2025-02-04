import { CloseOutlined } from '@ant-design/icons'
import { Button, Card, Form, FormInstance, Input, Tooltip } from 'antd'
import React, { FC } from 'react'

interface Props {
  form: FormInstance;
  editable: boolean
  onCustomServicesChange: (customServices: { _id: string; name: string }[]) => void;
}

const DomainsServices: FC<Props> = ({ form, editable, onCustomServicesChange }) => {
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
                      remove(field.name);
                      onCustomServicesChange(
                        fields
                          .map((f) => ({
                            _id: `${f.key}`,
                            name: form.getFieldValue(['domainServices', f.name, 'name']),
                          }))
                          .filter((s) => s.name) 
                      );
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
                    onChange={() => {
                      onCustomServicesChange(
                        fields
                          .map((f) => ({
                            _id: `${f.key}`,
                            name: form.getFieldValue(['domainServices', f.name, 'name']),
                          }))
                          .filter((s) => s.name) 
                      );
                    }}
                  />
                </Form.Item>
              </Card>
            ))}
            {editable && (
              <Tooltip title="Якщо послуги зі списку вам не підходять, ви можете створити власну">
              <Button
                type="dashed"
                style={{ marginBottom: 10 }}
                onClick={() => add()}
                block
              >
                + Додати послугу
              </Button>
              </Tooltip>
            )}
          </div>
        )}
      </Form.List>
    </>
  )
}

export default DomainsServices
