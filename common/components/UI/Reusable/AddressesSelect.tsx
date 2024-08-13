import { validateField } from '@assets/features/validators'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { useCompanyPageContext } from '@components/DashboardPage/blocks/realEstates'
import { IDomain } from '@modules/models/Domain'
import { IStreet } from '@modules/models/Street'
import { Form, Select } from 'antd'
import { CSSProperties, useEffect, useMemo } from 'react'

export default function AddressesSelect({
  form,
  edit,
  dropdownStyle,
}: {
  form: any
  edit?: boolean
  dropdownStyle?: CSSProperties
}) {
  const { streetId } = useCompanyPageContext()
  const domainId = Form.useWatch('domain', form)
  const { data = [], isLoading } = useGetDomainsQuery({
    domainId: domainId || undefined,
  })
  const domainObj = data.length > 0 ? data[0] : ({} as IDomain)
  const temp = (domainObj?.streets as any[]) || [] // eslint-disable-line react-hooks/exhaustive-deps
  const streets = useMemo<IStreet[]>(() => {
    return temp
  }, [temp])


  useEffect(() => {
    if (streets?.length === 1) {
      form.setFieldValue('street', streets[0]._id)
    } else {
      form.setFieldValue('street', undefined)
    }
  }, [form, streets]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{
    form.setFieldValue('street', streetId)
  },[form, streetId])

  return (
    <Form.Item name="street" label="Адреса" rules={validateField('required')}>
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
        options={
          streets?.map((i) => ({
            value: i._id,
            label: `${i.address} (м. ${i.city})`,
          })) || []
        }
        optionFilterProp="children"
        placeholder="Пошук адреси"
        disabled={isLoading || !domainId || streets?.length === 1 || edit}
        loading={isLoading}
        showSearch
        dropdownStyle={dropdownStyle}
      />
    </Form.Item>
  )
}
