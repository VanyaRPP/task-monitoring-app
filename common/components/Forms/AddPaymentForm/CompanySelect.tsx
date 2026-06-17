import { validateField } from '@assets/features/validators'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import RealEstateModal from '@components/UI/RealEstateComponents/RealEstateModal'
import { PlusOutlined } from '@ant-design/icons'
import { Button, Form, Select } from 'antd'
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
  const month = Form.useWatch('monthService', form)

  const canResolveCompany = !!domainId
  const isSelectDisabled = !domainId || !month

  if (!canResolveCompany) {
    return (
      <Form.Item label="Компанія">
        <Select placeholder="Оберіть надавача послуг та адресу" disabled />
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
      selectDisabled={isSelectDisabled}
    />
  )
}

interface RealEstateDataFetcherProps {
  domainId: string
  streetId?: string
  form: FormInstance
  edit?: boolean
  company?: string | Partial<IRealestate>
  selectDisabled: boolean
}

function RealEstateDataFetcher({
  domainId,
  streetId,
  form,
  edit,
  company,
  selectDisabled,
}: RealEstateDataFetcherProps) {
  const { data, isLoading, refetch } = useGetAllRealEstateQuery({
    domainId,
    streetId,
  })

  const companies = useMemo(() => data?.data ?? [], [data])

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)

  useEffect(() => {
    if (!edit) {
      if (companies?.length === 1) {
        form.setFieldValue('company', companies[0]._id)
      } else if (companies?.length > 0 && company) {
        const companyId = typeof company === 'object' ? company._id : company
        if (form.getFieldValue('company') !== companyId) {
          form.setFieldValue('company', companyId)
        }
      }
    }
  }, [companies, company, edit, form])

  const showCreateCompany = !isLoading && companies.length === 0

  return (
    <>
      {selectDisabled ? (
        <Form.Item label="Компанія">
          <Select placeholder="Оберіть надавача послуг та адресу" disabled />
        </Form.Item>
      ) : (
        <Form.Item
          name="company"
          label="Компанія"
          rules={validateField('required')}
        >
          <Select
            filterSort={(optionA, optionB) =>
              // TODO: invistagate ts-ignore issue
              (optionA?.label ?? '')
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                ?.toLowerCase()
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                .localeCompare((optionB?.label ?? '').toLowerCase())
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore

            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={companies?.map((i) => ({
              value: i._id,
              label: i.companyName,
            }))}
            optionFilterProp="children"
            placeholder="Пошук адреси"
            disabled={companies?.length === 1 || isLoading}
            loading={isLoading}
            showSearch
          />
        </Form.Item>
      )}

      {showCreateCompany && (
        <Button
          color="purple"
          variant="outlined"
          block
          icon={<PlusOutlined />}
          style={{ marginTop: 8, marginBottom: 8 }}
          onClick={() => setIsCompanyModalOpen(true)}
        >
          Немає компанії? Створити
        </Button>
      )}

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
