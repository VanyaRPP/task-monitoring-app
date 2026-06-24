import { validateField } from '@assets/features/validators'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import RealEstateModal from '@components/UI/RealEstateComponents/RealEstateModal'
import { PlusOutlined } from '@ant-design/icons'
import { Button, Divider, Form, Select } from 'antd'
import { FormInstance } from 'antd/es/form/Form'
import { useEffect, useMemo, useState } from 'react'

interface Props {
  form: FormInstance
  edit?: boolean
  company?: string | Partial<IRealestate>
}

export default function CompanySelect({ form, edit, company }: Props) {
  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)

  if (!domainId) {
    return (
      <Form.Item label="Компанія">
        <Select placeholder="Спершу оберіть надавача послуг" disabled />
      </Form.Item>
    )
  }

  return (
    <RealEstateDataFetcher
      domainId={domainId}
      streetId={streetId}
      form={form}
      edit={edit}
      company={company}
    />
  )
}

interface RealEstateDataFetcherProps {
  domainId: string
  streetId?: string
  form: FormInstance
  edit?: boolean
  company?: string | Partial<IRealestate>
}

function RealEstateDataFetcher({
  domainId,
  streetId,
  form,
  edit,
  company,
}: RealEstateDataFetcherProps) {
  const { data, isLoading, refetch } = useGetAllRealEstateQuery({
    domainId,
    streetId,
  })

  const companies = useMemo(() => data?.data ?? [], [data])

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)

  useEffect(() => {
    if (!edit) {
      if (companies.length === 1) {
        form.setFieldValue('company', companies[0]._id)
      } else if (companies.length > 0 && company) {
        const companyId = typeof company === 'object' ? company._id : company
        if (form.getFieldValue('company') !== companyId) {
          form.setFieldValue('company', companyId)
        }
      }
    }
  }, [companies, company, edit, form])

  const createCompanyLabel =
    companies.length === 0 ? 'Немає компанії? Створити' : 'Створити компанію'

  return (
    <>
      <Form.Item
        name="company"
        label="Компанія"
        rules={validateField('required')}
      >
        <Select
          filterSort={(optionA, optionB) =>
            (optionA?.label ?? '')
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              ?.toLowerCase()
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              .localeCompare((optionB?.label ?? '').toLowerCase())
          }
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={companies.map((i) => ({
            value: i._id,
            label: i.companyName,
          }))}
          optionFilterProp="label"
          placeholder="Пошук компанії"
          loading={isLoading}
          showSearch
          popupRender={(menu) => (
            <>
              {menu}
              <Divider style={{ margin: '8px 0' }} />
              <Button
                type="text"
                block
                icon={<PlusOutlined />}
                style={{ textAlign: 'left' }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsCompanyModalOpen(true)}
              >
                {createCompanyLabel}
              </Button>
            </>
          )}
        />
      </Form.Item>

      {isCompanyModalOpen && (
        <RealEstateModal
          chosenRealEstate={{ domain: domainId, street: streetId }}
          editable
          closeModal={() => {
            setIsCompanyModalOpen(false)
            refetch()
          }}
        />
      )}
    </>
  )
}
