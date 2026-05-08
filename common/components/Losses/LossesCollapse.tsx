import { inputNumberParser } from '@utils/helpers'
import {
  Col,
  Collapse,
  Flex,
  Form,
  FormInstance,
  InputNumber,
  Row,
  Typography,
} from 'antd'
import { useEffect, useMemo } from 'react'

const { Text } = Typography

export interface LossesCollapseProps {
  form: FormInstance
  name: string
  disabled?: boolean
}

export const LossesCollapse: React.FC<LossesCollapseProps> = (props) => {
  const { form, name, disabled = false } = props

  const customServices = Form.useWatch('customServices', form)
  const consumed: number = Form.useWatch('consumedElectricity', form) ?? 0

  // всього без пдв
  const total: number = Form.useWatch('generalElectricity', form) ?? 0

  // всього з пдв
  const totalWithVAT = total * 1.2

  // ціна з пдв
  const pricekWHWithVAT = useMemo(() => {
    const electricityService = customServices?.find(
      (item) => item?.fieldName === 'electricityPrice'
    )
    return electricityService?.price ?? 0
  }, [customServices])

  const hasElectricityService = useMemo(() => {
    return customServices?.some(
      (item) => item?.fieldName === 'electricityPrice'
    )
  }, [customServices])

  // ціна без пдв
  const pricekWH = pricekWHWithVAT / 1.2

  // всього по тарифу без пдв
  const totalFromTariff = pricekWH * consumed

  // втрати (з пдв і без пдв однакові)
  const losses = total / totalFromTariff - 1
  const lossesPercent = losses * 100

  const labelPricekWH = pricekWH ? pricekWH.toFixed(2) : 'Тариф'
  const labelConsumed = consumed ? consumed.toFixed(2) : 'Спожито'
  const labelTotal = total ? total.toFixed(2) : 'Загальне'
  const labelTotalWithVAT = totalWithVAT ? totalWithVAT.toFixed(2) : '0.00'
  const labelLossesPercent = lossesPercent ? lossesPercent.toFixed(2) : '0.00'

  useEffect(() => {
    if (!hasElectricityService) return

    // When upstream inputs (consumedElectricity, generalElectricity,
    // customServices.electricityPrice) are still loading, lossesPercent comes
    // out as NaN (0/0) or Infinity (X/0). In that case keep whatever was saved
    // — overwriting with 0 used to wipe the persisted loss value on every
    // re-render of the form until inputs settled, which is what the user saw
    // ("значення з'являється тільки після кліку").
    if (!Number.isFinite(lossesPercent)) {
      if (form.getFieldValue(name) == null) {
        form.setFieldValue(name, 0)
      }
      return
    }

    form.setFieldValue(name, Number(lossesPercent.toFixed(2)))
  }, [form, name, lossesPercent, hasElectricityService])

   // якщо немає послуги з ціною електроенергії, то не виводимо втрати
  if (!hasElectricityService) {
    return null
  }

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
              style={{ width: '100%' }}
            />
          </Form.Item>
        }
      >
        <Form.Item
          name="consumedElectricity"
          label="Спожито (кВт)"
          style={{ flex: 1 }}
        >
          <InputNumber placeholder="Спожито" style={{ width: '100%' }} />
        </Form.Item>

        <Flex style={{ width: '100%' }} gap={16}>
          <Form.Item
            name="generalElectricity"
            label="Всього (грн без ПДВ)"
            style={{ flex: 1 }}
          >
            <InputNumber placeholder="Загальне" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Всього (грн з ПДВ)" style={{ flex: 1 }}>
            <Text>{labelTotalWithVAT}</Text>
          </Form.Item>
        </Flex>

        <Row
          align="middle"
          justify="center"
          style={{ fontSize: 20, fontFamily: 'serif', lineHeight: 1.2 }}
        >
          <Col style={{ textAlign: 'center', marginRight: 8 }}>
            {labelTotal} - ({labelPricekWH} * {labelConsumed})
            <div style={{ borderTop: '1px solid', margin: '2px 0' }} />(
            {labelPricekWH} * {labelConsumed})
          </Col>
          <Col>
            <Text>× 100 ≈ {labelLossesPercent}%</Text>
          </Col>
        </Row>
      </Collapse.Panel>
    </Collapse>
  )
}
