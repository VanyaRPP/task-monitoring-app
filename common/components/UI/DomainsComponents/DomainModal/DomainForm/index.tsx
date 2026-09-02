import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { isDomainViewer } from '@utils/domain/domain-view-access'
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
  const { data: user } = useGetCurrentUserQuery()

  // A view-only user gets «Загальне» and nothing else — the remaining tabs are
  // administrative surfaces. The gate lives here rather than at the call sites
  // so no entry point into the domain form can render them, and the API
  // withholds their data regardless (see domain-view-access).
  // While roles are still loading we treat the reader as a viewer, so nothing
  // admin-only can flash on screen.
  const isViewer = isDomainViewer(user?.roles)

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
          ...(isViewer
            ? []
            : [
                {
                  key: 'template',
                  label: 'Шаблон',
                  children: <TemplateTab {...tabProps} />,
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
              ]),
        ]}
      />
    </Form>
  )
}

export default DomainForm
