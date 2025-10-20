import React, { useEffect, useState } from 'react'
import {
  Collapse,
  InputNumber,
  Form,
  Checkbox,
  Row,
  Col,
  Space,
  Typography,
} from 'antd'
import { inputNumberParser } from '@utils/helpers'

export const LossesCollapse = ({
  form,
  name,
  isServiceForm,
  disabled = false,
}) => {
  const { Text } = Typography
  const [pricekWH, setPricekWH] = useState(0)

  const customServices = Form.useWatch('customServices', form)
  const consumed = Form.useWatch('consumedElectricity', form)
  const total = Form.useWatch('generalElectricity', form)
  const isVAT = Form.useWatch('isVAT', form)

  useEffect(() => {
    const electricityService = customServices?.find(
      (item) => item?.fieldName === 'electricityPrice'
    )
    setPricekWH(electricityService?.price ?? 0)
  }, [customServices])

  useEffect(() => {
    if (consumed && total) {
      const rawPrice = pricekWH
      const tariff = isVAT ? Number(rawPrice) : Number(rawPrice) / 1.2
      const priceWithTariff = tariff * Number(consumed)
      const lossesPercent =
        ((Number(total) - priceWithTariff) / priceWithTariff) * 100
      const formatted = Number(lossesPercent.toFixed(2))
      form.setFieldsValue({ losses: formatted })
    }
  }, [consumed, total, isVAT, pricekWH])

  return (
    <Collapse size="small" bordered={false}>
      <Collapse.Panel
        key="1"
        style={{ marginBottom: -24 }}
        header={
          <Form.Item
            label="Втрати в трансформаторі, лініях, реактивна (%)"
            name={name}
          >
            <InputNumber
              parser={inputNumberParser}
              placeholder="Втрати електроенергії"
              disabled={disabled}
              style={{
                width: disabled ? '100%' : !isServiceForm ? 365 : 395,
              }}
            />
          </Form.Item>
        }
      >
        <Space
          direction="horizontal"
          style={{
            marginBottom: 16,
            width: '100%',
            justifyContent: 'space-evenly',
          }}
        >
          <Space direction="vertical">
            <Text>Спожито (кВт)</Text>
            <Form.Item name="consumedElectricity" noStyle>
              <InputNumber
                placeholder="Спожито"
                style={{ width: 150 }}
                onChange={(value) =>
                  form.setFieldValue('consumedElectricity', value)
                }
              />
            </Form.Item>
            <div />
            <Text>Ціна кВт: {isVAT ? pricekWH : (pricekWH / 1.2).toFixed(2)}</Text>
          </Space>

          <Space direction="vertical">
            <Text>Всього (грн без ПДВ)</Text>
            <Form.Item name="generalElectricity" noStyle>
              <InputNumber
                placeholder="Загальне"
                style={{ width: 150 }}
                onChange={(value) =>
                  form.setFieldValue('generalElectricity', value)
                }
              />
            </Form.Item>
            <div />
            <Form.Item name="isVAT" valuePropName="checked" noStyle>
              <Checkbox
                onChange={(e) => form.setFieldValue('isVAT', e.target.checked)}
              >
                ПДВ (+20%)
              </Checkbox>
            </Form.Item>
          </Space>
        </Space>

        <Row
          align="middle"
          justify="center"
          style={{ fontSize: 20, fontFamily: 'serif', lineHeight: 1.2 }}
        >
          <Col style={{ textAlign: 'center', marginRight: 8 }}>
            {total || 'Загальне'} - (
            {isVAT ? pricekWH : (pricekWH / 1.2).toFixed(2)} *{' '}
            {consumed || 'Спожито'})
            <div
              style={{
                borderTop: '1px solid',
                margin: '2px 0',
              }}
            />
            ({isVAT ? pricekWH : (pricekWH / 1.2).toFixed(2)} *{' '}
            {consumed || 'Спожито'})
          </Col>
          <Col>
            <Text>
              × 100 ≈ {form.getFieldValue('losses') ?? 0}%
            </Text>
          </Col>
        </Row>
      </Collapse.Panel>
    </Collapse>
  )
}
