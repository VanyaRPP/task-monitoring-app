import {
  useCreateInvoiceTemplateMutation,
  useDeleteInvoiceTemplateMutation,
  useGetInvoiceTemplatesQuery,
} from '@common/api/invoiceTemplateApi/invoiceTemplate.api'
import { IInvoiceTemplate } from '@common/api/invoiceTemplateApi/invoiceTemplate.api.types'
import InvoiceTemplateEditor from '@components/Forms/InvoiceTemplateEditor'
import {
  Button,
  Drawer,
  Form,
  FormInstance,
  List,
  Popconfirm,
  Select,
  Space,
  Tag,
  message,
} from 'antd'
import { FC, useState } from 'react'
import s from '../style.module.scss'

const TEMPLATE_OPTIONS = [
  { value: 'classic', label: 'Класичний шаблон' },
  { value: 'olimp', label: 'OLIMP DIGITAL OÜ' },
  { value: 'ledger', label: 'Formal Ledger' },
  { value: 'official', label: 'Official Invoice' },
]

interface Props {
  editable: boolean
  domainId?: string
  form: FormInstance
  setIsValueChanged: (value: boolean) => void
}

const TemplateTab: FC<Props> = ({
  editable,
  domainId,
  form,
  setIsValueChanged,
}) => {
  const { data } = useGetInvoiceTemplatesQuery(
    { domainId: domainId as string },
    { skip: !domainId }
  )
  const templates = data?.data ?? []
  const [createTemplate] = useCreateInvoiceTemplateMutation()
  const [deleteTemplate] = useDeleteInvoiceTemplateMutation()
  const defaultTemplate = Form.useWatch('defaultTemplate', form)

  const [drawer, setDrawer] = useState<{
    open: boolean
    template: IInvoiceTemplate | null
  }>({ open: false, template: null })

  const previewData = {
    invoiceNumber: 1001,
    invoiceCreationDate: new Date().toISOString(),
    generalSum: 1000,
    currency: 'UAH',
    invoice: [
      { type: 'maintenancePrice', name: 'Послуга', sum: 1000, amount: 1 },
    ],
    provider: { description: '' },
    reciever: { description: '', companyName: 'ТОВ «Приклад»' },
    domain: domainId,
  }

  const setAsDefault = (id: string) => {
    form.setFieldValue('defaultTemplate', id)
    setIsValueChanged(true)
  }

  const handleDuplicate = async (t: IInvoiceTemplate) => {
    if (!domainId) return
    const result = await createTemplate({
      name: `Copy - ${t.name}`,
      baseTemplateKey: t.baseTemplateKey,
      providerDescription: t.providerDescription,
      receiverDescription: t.receiverDescription,
      overrides: t.overrides,
      domainId,
    })
    if ('data' in result) {
      message.success('Шаблон продубльовано')
    } else {
      message.error('Помилка дублювання')
    }
  }

  const handleDelete = async (t: IInvoiceTemplate) => {
    const result = await deleteTemplate({ _id: t._id })
    if ('data' in result) {
      message.success('Шаблон видалено')
      if (defaultTemplate === t._id) {
        form.setFieldValue('defaultTemplate', null)
        setIsValueChanged(true)
      }
    } else {
      message.error('Помилка видалення')
    }
  }

  return (
    <>
      <Form.Item
        name="defaultTemplate"
        label="Шаблон за замовчуванням для рахунків"
        className={s.templateItem}
      >
        <Select
          options={[
            ...TEMPLATE_OPTIONS,
            ...templates.map((t) => ({ value: t._id, label: t.name })),
          ]}
          placeholder="Класичний шаблон"
          disabled={!editable}
          allowClear
        />
      </Form.Item>

      {!domainId ? (
        <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
          Збережіть надавача послуг, щоб керувати його шаблонами рахунків.
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <strong>Шаблони рахунків домену</strong>
            {editable && (
              <Button
                type="primary"
                size="small"
                onClick={() => setDrawer({ open: true, template: null })}
              >
                + Новий шаблон
              </Button>
            )}
          </div>

          <List
            size="small"
            bordered
            locale={{ emptyText: 'Кастомних шаблонів ще немає' }}
            dataSource={templates}
            renderItem={(t) => (
              <List.Item
                actions={
                  editable
                    ? [
                        <Button
                          key="edit"
                          type="link"
                          size="small"
                          onClick={() => setDrawer({ open: true, template: t })}
                        >
                          Редагувати
                        </Button>,
                        <Button
                          key="dup"
                          type="link"
                          size="small"
                          onClick={() => handleDuplicate(t)}
                        >
                          Дублювати
                        </Button>,
                        <Button
                          key="default"
                          type="link"
                          size="small"
                          disabled={defaultTemplate === t._id}
                          onClick={() => setAsDefault(t._id)}
                        >
                          Зробити дефолтом
                        </Button>,
                        <Popconfirm
                          key="del"
                          title="Видалити шаблон?"
                          okText="Видалити"
                          cancelText="Скасувати"
                          onConfirm={() => handleDelete(t)}
                        >
                          <Button type="link" size="small" danger>
                            Видалити
                          </Button>
                        </Popconfirm>,
                      ]
                    : []
                }
              >
                <Space>
                  <span>{t.name}</span>
                  {defaultTemplate === t._id && <Tag color="blue">дефолт</Tag>}
                </Space>
              </List.Item>
            )}
          />
        </>
      )}

      <Drawer
        title={drawer.template ? 'Редагування шаблону' : 'Новий шаблон'}
        width={920}
        open={drawer.open}
        onClose={() => setDrawer({ open: false, template: null })}
        destroyOnClose
      >
        {domainId && (
          <InvoiceTemplateEditor
            domainId={domainId}
            existingTemplate={drawer.template}
            baseTemplateKey={drawer.template?.baseTemplateKey || 'classic'}
            previewData={previewData}
            previewLang="uk"
            defaultName={drawer.template ? undefined : 'Новий шаблон'}
            onSaved={() => setDrawer({ open: false, template: null })}
            onCancel={() => setDrawer({ open: false, template: null })}
          />
        )}
      </Drawer>
    </>
  )
}

export default TemplateTab
