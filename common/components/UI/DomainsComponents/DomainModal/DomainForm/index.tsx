import { Form, FormInstance, Tabs } from 'antd'
import { FC } from 'react'
import BankTab from './tabs/BankTab'
import GeneralTab from './tabs/GeneralTab'
import HistoryTab from './tabs/HistoryTab'
import MyServicesTab from './tabs/MyServicesTab'
import TemplateTab from './tabs/TemplateTab'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
  editable?: boolean
  setIsValueChanged: (value: boolean) => void
  domainId?: string
}

const DomainForm: FC<Props> = ({
  form,
  editable = true,
  setIsValueChanged,
  domainId,
}) => {
  const tabProps = { form, editable, domainId, setIsValueChanged }

  return (
    <Form
      form={form}
      requiredMark={editable}
      layout="vertical"
      className={s.Form}
      onValuesChange={() => setIsValueChanged(true)}
    >
      <Tabs
        defaultActiveKey="general"
        destroyInactiveTabPane={false}
        items={[
          {
            key: 'general',
            label: 'Загальне',
            children: <GeneralTab {...tabProps} />,
          },
          {
            key: 'template',
            label: 'Шаблон',
            children: <TemplateTab editable={editable} />,
          },
          {
            key: 'services',
            label: 'Мої послуги',
            children: <MyServicesTab {...tabProps} />,
          },
          {
            key: 'history',
            label: 'Історія налаштувань',
            children: <HistoryTab form={form} domainId={domainId} />,
          },
          {
            key: 'bank',
            label: 'Банк API',
            children: <BankTab {...tabProps} />,
          },
        ]}
      />
    </Form>
  )
}

export default DomainForm
