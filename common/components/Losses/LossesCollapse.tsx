import react, { use, useEffect, useState } from 'react'
import { 
  Collapse, 
  InputNumber, 
  Form,
  Checkbox,
  Input,
  Row, 
  Col,
  Space,
  Typography
} from 'antd'
import { inputNumberParser } from '@utils/helpers'

export const LossesCollapse = ({ 
  form,
  name,
  index,
  isServiceForm, 
  disabled = false 
}) => {
  const { Text } = Typography
  const [isVAT, setIsVAT] = useState(true)
  const [consumed, setConsumed] = useState(null)
  const [total, setTotal] = useState(null)
  const [losses, setLosses] = useState(null)

useEffect(() => {
  if (consumed && total) {
    const rawPrice = form.getFieldValue(['customServices', 5, 'price']);
    const tariff = isVAT ? Number(rawPrice) : Number(rawPrice) * 0.8;

    const priceWithTariff = tariff * Number(consumed);

    const lossesPercent = ((Number(total) - priceWithTariff) / priceWithTariff) * 100;

    const formatted = lossesPercent.toFixed(2);
    setLosses(formatted);
    form.setFieldsValue({ losses: formatted });
  }
}, [consumed, total, isVAT]);

  return (
  <Collapse
    size='small'
    bordered={false}
  >
    <Collapse.Panel 
      style={{
        marginBottom: -24,
      }}
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
      key="1"
    >
    <Space direction='horizontal' style={{ marginBottom: 16, width: '100%', justifyContent: 'space-evenly' }}>
      <Space direction='vertical'>
        <Text>Спожито (кВт)</Text>
        <InputNumber placeholder='Спожито' style={{ width: 150 }} onChange={(value) => setConsumed(value)}></InputNumber>
        <div/>
        <Text>Ціна кВт: {isVAT ? form.getFieldValue(['customServices', 5, 'price']) : (form.getFieldValue(['customServices', 5, 'price']) * 0.8).toFixed(2)}</Text>
      </Space>
      <Space direction='vertical'>
        <Text>Всього (грн без ПДВ)</Text>
        <InputNumber placeholder='Загальне' style={{ width: 150 }} onChange={(value) => setTotal(value)}></InputNumber>
        <div/>
        <Checkbox
          checked={isVAT}
          onChange={(e) => setIsVAT(e.target.checked)}
        >
          ПДВ (+20%)
        </Checkbox>
      </Space>
    </Space>
    <br/>
    <Row
      align="middle"
      justify="center"
      style={{ fontSize: 20, fontFamily: 'serif', lineHeight: 1.2 }}
    >
      <Col style={{ textAlign: 'center', marginRight: 8 }}>
        {total || 'Загальне'} - ({isVAT ? form.getFieldValue(['customServices', 5, 'price']) : (form.getFieldValue(['customServices', 5, 'price']) * 0.8).toFixed(2)} * {consumed || 'Спожито'})
        <div
          style={{
            borderTop: '1px solid',
            margin: '2px 0',
          }}
        />
        ({isVAT ? form.getFieldValue(['customServices', 5, 'price']) : (form.getFieldValue(['customServices', 5, 'price']) * 0.8).toFixed(2)} * {consumed || 'Спожито'})
      </Col>
      <Col>
        <Text>× 100 ≈ {losses}%</Text>
      </Col>
    </Row>

    </Collapse.Panel>
  </Collapse>)
}

