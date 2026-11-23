import ServicesSelect from '@components/UI/Reusable/ServicesSelect'
import { Form, Switch } from 'antd'
import { FC } from 'react'
import AreaCalculationCard from '../DomainAreaCalc'
import DomainsServices from '../DomainsServices'
import type { TabProps } from './types'

const MyServicesTab: FC<TabProps> = ({
  form,
  editable,
  domainId,
  setIsValueChanged,
}) => (
  <>
    <Form.Item
      name="hideQuantityAndPrice"
      label="Не показувати кількість і ціну в довідках"
      tooltip="Діє на всі довідки й рахунки цього домену, включно зі старими: у рахунку, PDF та Excel лишається тільки сума"
      valuePropName="checked"
    >
      <Switch disabled={!editable} />
    </Form.Item>
    <ServicesSelect form={form} disabled={!editable} domainId={domainId} />
    <DomainsServices
      form={form}
      editable={editable}
      domainId={domainId}
      renderSnapshotsList={false}
    />
    <AreaCalculationCard
      domainId={domainId}
      editable={editable}
      form={form}
      setIsValueChanged={setIsValueChanged}
    />
  </>
)

export default MyServicesTab
