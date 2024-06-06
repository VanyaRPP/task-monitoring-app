import {
  useGetDomainQuery,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import {
  useAddRealEstateMutation,
  useEditRealEstateMutation,
  useGetRealEstateQuery,
  useGetRealEstatesQuery,
} from '@common/api/realestateApi/realestate.api'
import {
  useGetStreetQuery,
  useGetStreetsQuery,
} from '@common/api/streetApi/street.api'
import { EditFormItemProps, EditFormProps } from '@common/components/Forms'
import { Loading } from '@common/components/UI/Loading'
import { IDomain } from '@common/modules/models/Domain'
import { IRealEstate } from '@common/modules/models/RealEstate'
import { IStreet } from '@common/modules/models/Street'
import {
  Checkbox,
  Divider,
  Form,
  FormInstance,
  Input,
  Select,
  Tag,
  message,
} from 'antd'
import { useCallback, useEffect } from 'react'

export interface EditCompanyFormProps extends EditFormProps<IRealEstate> {
  form?: FormInstance
  company?: IRealEstate['_id']
  street?: IStreet['_id']
  domain?: IDomain['_id']
}

/**
 * Create/edit company form
 *
 * @param form - form instance (to use controls from parent component, such as `form.submit()`)
 * @param company - editing company id (leave empty to create new company)
 * @param street - default street id
 * @param domain - default domain id
 * @param editable - describes is form read-only or can be edited (default - `true`)
 * @param onFinish - callback executed on successfull form submit
 * @param onFinishFailed - callback executed on error appeared when form submit
 * @param ...props - rest of `antd#Form` props
 */
export const EditCompanyForm: React.FC<EditCompanyFormProps> = ({
  form: _form,
  company: companyId,
  street: streetId,
  domain: domainId,
  editable = true,
  onFinish,
  onFinishFailed,
  ...props
}) => {
  const [form] = Form.useForm(_form)

  const { data: company, isLoading: isCompanyLoading } = useGetRealEstateQuery(
    companyId,
    { skip: !companyId }
  )
  const [addCompany, { isLoading: isAddLoading }] = useAddRealEstateMutation()
  const [editCompany, { isLoading: isEditLoading }] =
    useEditRealEstateMutation()

  const isLoading = isCompanyLoading || isEditLoading || isAddLoading

  const handleFinish = useCallback(
    async (fields: any) => {
      try {
        const response = company
          ? await editCompany({
              _id: company._id,
              ...fields,
            })
          : await addCompany(fields)

        if ('data' in response) {
          if (companyId && company) {
            message.success('Зміни для компанії збережено')
          } else {
            message.success('Компанію успішно додано')
          }
          onFinish?.(response.data)
        } else if ('error' in response) {
          throw response.error
        }
      } catch (error: any) {
        onFinishFailed?.(error)
        message.error('Виникла помилка при збереженні')
      }
    },
    [companyId, company, onFinish, onFinishFailed, editCompany, addCompany]
  )

  useEffect(() => {
    if (companyId && company) {
      form.setFieldsValue({
        ...company,
        street: company?.street._id,
        domain: company?.domain._id,
      })
    } else {
      form.resetFields()
    }
  }, [form, companyId, company])

  return (
    <Form
      onFinish={handleFinish}
      initialValues={{ street: streetId, domain: domainId }}
      form={form}
      layout="vertical"
      requiredMark={editable}
      {...props}
    >
      <CompanyName form={form} loading={isLoading} editable={editable} />
      <Description form={form} loading={isLoading} editable={editable} />
      <AdminEmails form={form} loading={isLoading} editable={editable} />
      <Domain form={form} loading={isLoading} editable={editable} />
      <Street form={form} loading={isLoading} editable={editable} />
      <Maintenance form={form} loading={isLoading} editable={editable} />
      <Part form={form} loading={isLoading} editable={editable} />
      <Cleaning form={form} loading={isLoading} editable={editable} />
      <Discount form={form} loading={isLoading} editable={editable} />
      <InflicionAndGarbageCollector
        form={form}
        loading={isLoading}
        editable={editable}
      />
    </Form>
  )
}

const CompanyName: React.FC<EditFormItemProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const companyName = Form.useWatch('companyName', form)

  return (
    <Form.Item
      label="Назва"
      name="companyName"
      rules={[{ required: true, message: `Поле "Назва" обов'язкове` }]}
    >
      <Loading loading={loading}>
        {editable ? (
          <Input placeholder="Введіть назву" disabled={disabled} />
        ) : (
          companyName
        )}
      </Loading>
    </Form.Item>
  )
}

const Description: React.FC<EditFormItemProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const description = Form.useWatch('description', form)

  return (
    <Form.Item label="Опис" name="description">
      <Loading loading={loading}>
        {editable ? (
          <Input.TextArea
            rows={3}
            placeholder="Введіть опис"
            disabled={disabled}
          />
        ) : (
          description
        )}
      </Loading>
    </Form.Item>
  )
}

const AdminEmails: React.FC<EditFormItemProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const adminEmails: string[] | undefined = Form.useWatch('adminEmails', form)

  const { data: allCompanies, isLoading: isAllCompaniesLoading } =
    useGetRealEstatesQuery({})

  return (
    <Form.Item
      label="Адреси представників"
      name="adminEmails"
      rules={[
        { required: true, message: `Поле "Адреси представників" обов'язкове` },
      ]}
    >
      <Loading loading={loading}>
        {editable ? (
          <Select
            mode="tags"
            placeholder="Оберіть елекронні адреси"
            disabled={disabled}
            loading={isAllCompaniesLoading}
            showSearch
            allowClear
            optionFilterProp="text"
            options={allCompanies?.filter.adminEmails}
          />
        ) : (
          <Form.Item noStyle>
            {adminEmails?.map((adminEmail) => (
              <Tag key={adminEmail}>{adminEmail}</Tag>
            ))}
          </Form.Item>
        )}
      </Loading>
    </Form.Item>
  )
}

const Domain: React.FC<EditFormItemProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const streetId: string | undefined = Form.useWatch('street', form)
  const domainId: string | undefined = Form.useWatch('domain', form)

  const { data: domain, isLoading: isDomainLoading } = useGetDomainQuery(
    domainId,
    { skip: !domainId }
  )
  const { data: domains, isLoading: isDomainsLoading } = useGetDomainsQuery({})

  return (
    <Form.Item
      label="Надавач послуг"
      name="domain"
      rules={[{ required: true, message: `Поле "Надавач послуг" обов'язкове` }]}
    >
      <Loading loading={loading}>
        {editable ? (
          <Select
            placeholder="Оберіть надавача послуг"
            loading={isDomainsLoading}
            disabled={disabled || !!streetId}
            showSearch
            allowClear
            optionFilterProp="label"
            options={domains?.data.map(({ _id, name }) => ({
              label: name,
              value: _id,
            }))}
          />
        ) : (
          <Loading loading={isDomainLoading}>{domain?.name}</Loading>
        )}
      </Loading>
    </Form.Item>
  )
}

const Street: React.FC<EditFormItemProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const streetId: string | undefined = Form.useWatch('street', form)
  const domainId: string | undefined = Form.useWatch('domain', form)

  const { data: street, isLoading: isStreetLoading } = useGetStreetQuery(
    streetId,
    { skip: !streetId }
  )
  const { data: streets, isLoading: isStreetsLoading } = useGetStreetsQuery({
    domainId,
  })

  return (
    <Form.Item
      label="Адреса"
      name="street"
      rules={[{ required: true, message: `Поле "Адреса" обов'язкове` }]}
    >
      <Loading loading={loading}>
        {editable ? (
          <Select
            placeholder="Оберіть адресу"
            loading={isStreetsLoading}
            disabled={disabled || !domainId}
            showSearch
            allowClear
            optionFilterProp="label"
            options={streets?.data.map((street) => ({
              label: `вул. ${street.address} (м. ${street.city})`,
              value: street._id,
            }))}
          />
        ) : (
          <Loading loading={isStreetLoading}>
            вул. {street.address} (м. {street.city})
          </Loading>
        )}
      </Loading>
    </Form.Item>
  )
}

const Maintenance: React.FC<EditFormItemProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const pricePerMeter: number | undefined = Form.useWatch('pricePerMeter', form)
  const totalArea: number | undefined = Form.useWatch('totalArea', form)
  const servicePricePerMeter: number | undefined = Form.useWatch(
    'servicePricePerMeter',
    form
  )

  return (
    <Form.Item label="Утримання" style={{ margin: 0 }}>
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 8,
        }}
      >
        <Form.Item
          style={{ flex: 1 }}
          name="pricePerMeter"
          label="Ціна (грн/м²)"
          rules={[{ required: true, message: `Поле "Ціна" обов'язкове` }]}
        >
          <Loading loading={loading}>
            {editable ? (
              <Input
                type="number"
                placeholder="Вкажіть значення"
                disabled={disabled}
              />
            ) : (
              pricePerMeter
            )}
          </Loading>
        </Form.Item>
        {!editable && <Divider type="vertical" style={{ height: 64 }} />}
        <Form.Item style={{ flex: 1 }} name="totalArea" label="Площа (м²)">
          <Loading loading={loading}>
            {editable ? (
              <Input
                type="number"
                placeholder="Вкажіть значення"
                disabled={disabled}
              />
            ) : (
              totalArea
            )}
          </Loading>
        </Form.Item>
        {!editable && <Divider type="vertical" style={{ height: 64 }} />}
        <Form.Item
          style={{ flex: 1 }}
          name="servicePricePerMeter"
          label="Сервіс (грн/м²)"
        >
          <Loading loading={loading}>
            {editable ? (
              <Input
                type="number"
                placeholder="Вкажіть значення"
                disabled={disabled}
              />
            ) : (
              servicePricePerMeter
            )}
          </Loading>
        </Form.Item>
      </div>
    </Form.Item>
  )
}

const Part: React.FC<EditFormItemProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const rentPart: number | undefined = Form.useWatch('rentPart', form)
  const waterPart: number | undefined = Form.useWatch('waterPart', form)

  return (
    <Form.Item label="Частка" style={{ margin: 0 }}>
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 8,
        }}
      >
        <Form.Item style={{ flex: 1 }} name="rentPart" label="Загальної площі">
          <Loading loading={loading}>
            {editable ? (
              <Input
                type="number"
                placeholder="Вкажіть значення"
                disabled={disabled}
              />
            ) : (
              rentPart
            )}
          </Loading>
        </Form.Item>
        <Form.Item style={{ flex: 1 }} name="waterPart" label="Водопостачання">
          <Loading loading={loading}>
            {editable ? (
              <Input
                type="number"
                placeholder="Вкажіть значення"
                disabled={disabled}
              />
            ) : (
              waterPart
            )}
          </Loading>
        </Form.Item>
      </div>
    </Form.Item>
  )
}

const Cleaning: React.FC<EditFormItemProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const cleaning: number | undefined = Form.useWatch('cleaning', form)

  return (
    <Form.Item label="Прибирання (грн)" name="cleaning">
      <Loading loading={loading}>
        {editable ? (
          <Input
            type="number"
            placeholder="Вкажіть значення"
            disabled={disabled}
          />
        ) : (
          cleaning
        )}
      </Loading>
    </Form.Item>
  )
}

const Discount: React.FC<EditFormItemProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const discount: number | undefined = Form.useWatch('discount', form)

  return (
    <Form.Item
      label="Знижка (грн)"
      name="discount"
      rules={[
        {
          validator: () => {
            if (discount > 0) {
              return Promise.reject('Знижка повинна бути менша або рівна 0 грн')
            }
            return Promise.resolve()
          },
        },
      ]}
    >
      <Loading loading={loading}>
        {editable ? (
          <Input
            type="number"
            placeholder="Вкажіть значення"
            disabled={disabled}
            max={0}
          />
        ) : (
          discount
        )}
      </Loading>
    </Form.Item>
  )
}

const InflicionAndGarbageCollector: React.FC<EditFormItemProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexWrap: 'nowrap',
        gap: 8,
      }}
    >
      <Form.Item
        style={{ flex: 1 }}
        label="Вивіз ТПВ"
        name="garbageCollector"
        valuePropName="checked"
      >
        <Loading loading={loading}>
          <Checkbox disabled={disabled || !editable} />
        </Loading>
      </Form.Item>
      <Form.Item
        style={{ flex: 1 }}
        label="Інфляція"
        name="inflicion"
        valuePropName="checked"
      >
        <Loading loading={loading}>
          <Checkbox disabled={disabled || !editable} />
        </Loading>
      </Form.Item>
    </div>
  )
}
