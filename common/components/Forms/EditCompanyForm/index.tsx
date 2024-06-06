import { useGetDomainQuery } from '@common/api/domainApi/domain.api'
import {
  useAddRealEstateMutation,
  useEditRealEstateMutation,
  useGetRealEstateQuery,
} from '@common/api/realestateApi/realestate.api'
import { useGetStreetQuery } from '@common/api/streetApi/street.api'
import {
  EditFormAttributeProps,
  EditFormItem,
  EditFormProps,
} from '@common/components/Forms'
import { Loading } from '@common/components/UI/Loading'
import { CompanyAdminSelect } from '@common/components/UI/Selectors/CompanyAdminSelect'
import { DomainSelect } from '@common/components/UI/Selectors/DomainSelect'
import { StreetSelect } from '@common/components/UI/Selectors/StreetSelect'
import { IDomain } from '@common/modules/models/Domain'
import { IRealEstate } from '@common/modules/models/RealEstate'
import { IStreet } from '@common/modules/models/Street'
import {
  Checkbox,
  Divider,
  Form,
  FormInstance,
  Input,
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
      {!editable && <Divider style={{ margin: '8px 0' }} />}
      <Description form={form} loading={isLoading} editable={editable} />
      {!editable && <Divider style={{ margin: '8px 0' }} />}
      <AdminEmails form={form} loading={isLoading} editable={editable} />
      {!editable && <Divider style={{ margin: '8px 0' }} />}
      <Domain form={form} loading={isLoading} editable={editable} />
      {!editable && <Divider style={{ margin: '8px 0' }} />}
      <Street form={form} loading={isLoading} editable={editable} />
      {!editable && <Divider style={{ margin: '8px 0' }} />}
      <Maintenance form={form} loading={isLoading} editable={editable} />
      {!editable && <Divider style={{ margin: '8px 0' }} />}
      <Part form={form} loading={isLoading} editable={editable} />
      {!editable && <Divider style={{ margin: '8px 0' }} />}
      <Cleaning form={form} loading={isLoading} editable={editable} />
      {!editable && <Divider style={{ margin: '8px 0' }} />}
      <Discount form={form} loading={isLoading} editable={editable} />
      {!editable && <Divider style={{ margin: '8px 0' }} />}
      <InflicionAndGarbageCollector
        form={form}
        loading={isLoading}
        editable={editable}
      />
    </Form>
  )
}

const CompanyName: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const companyName = Form.useWatch('companyName', form)

  return (
    <EditFormItem
      label="Назва"
      name="companyName"
      rules={[{ required: true, message: `Поле обов'язкове` }]}
      loading={loading}
      noStyle={!editable}
    >
      {editable ? (
        <Input placeholder="Введіть назву..." disabled={disabled} />
      ) : (
        companyName
      )}
    </EditFormItem>
  )
}

const Description: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const description = Form.useWatch('description', form)

  return (
    <EditFormItem
      label="Опис"
      name="description"
      loading={loading}
      noStyle={!editable}
    >
      {editable ? (
        <Input.TextArea
          rows={3}
          placeholder="Введіть опис..."
          disabled={disabled}
        />
      ) : (
        description
      )}
    </EditFormItem>
  )
}

const AdminEmails: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const adminEmails: string[] | undefined = Form.useWatch('adminEmails', form)

  return (
    <EditFormItem
      label="Адреси представників"
      name="adminEmails"
      rules={[{ required: true, message: `Поле обов'язкове` }]}
      loading={loading}
      noStyle={!editable}
      required
    >
      {editable ? (
        <CompanyAdminSelect mode="tags" disabled={disabled} />
      ) : (
        adminEmails?.map((adminEmail) => (
          <Tag key={adminEmail}>{adminEmail}</Tag>
        ))
      )}
    </EditFormItem>
  )
}

const Domain: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const streetId: string | undefined = Form.useWatch('street', form)
  const domainId: string | undefined = Form.useWatch('domain', form)

  const { data: domain, isLoading: isDomainLoading } = useGetDomainQuery(
    domainId,
    { skip: !domainId || editable }
  )
  return (
    <EditFormItem
      label="Надавач послуг"
      name="domain"
      rules={[{ required: true, message: `Поле обов'язкове` }]}
      loading={loading}
      noStyle={!editable}
      required
    >
      {editable ? (
        <DomainSelect street={streetId} disabled={disabled} />
      ) : (
        <Loading loading={isDomainLoading}>{domain?.name}</Loading>
      )}
    </EditFormItem>
  )
}

const Street: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const streetId: string | undefined = Form.useWatch('street', form)
  const domainId: string | undefined = Form.useWatch('domain', form)

  const { data: street, isLoading: isStreetLoading } = useGetStreetQuery(
    streetId,
    { skip: !streetId || editable }
  )

  useEffect(() => {
    if (!domainId) form.setFieldValue('street', null)
  }, [form, domainId])

  return (
    <EditFormItem
      label="Адреса"
      name="street"
      rules={[{ required: true, message: `Поле обов'язкове` }]}
      loading={loading}
      noStyle={!editable}
      required
    >
      {editable ? (
        <StreetSelect domain={domainId} disabled={disabled || !domainId} />
      ) : (
        <Loading loading={isStreetLoading}>
          вул. {street?.address} (м. {street?.city})
        </Loading>
      )}
    </EditFormItem>
  )
}

const Maintenance: React.FC<EditFormAttributeProps> = ({
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
        style={{ width: '100%', display: 'flex', flexWrap: 'nowrap', gap: 8 }}
      >
        <EditFormItem
          style={{ flex: 1 }}
          label="Ціна (грн/м²)"
          name="pricePerMeter"
          rules={[{ required: true, message: `Поле обов'язкове` }]}
          loading={loading}
          noStyle={!editable}
          required
        >
          {editable ? (
            <Input
              type="number"
              placeholder="Вкажіть значення..."
              disabled={disabled}
            />
          ) : (
            pricePerMeter
          )}
        </EditFormItem>

        {!editable && (
          <Divider type="vertical" style={{ height: 64, margin: '0 8px' }} />
        )}

        <EditFormItem
          style={{ flex: 1 }}
          label="Площа (м²)"
          name="totalArea"
          loading={loading}
          noStyle={!editable}
        >
          {editable ? (
            <Input
              type="number"
              placeholder="Вкажіть значення..."
              disabled={disabled}
            />
          ) : (
            totalArea
          )}
        </EditFormItem>

        {!editable && (
          <Divider type="vertical" style={{ height: 64, margin: '0 8px' }} />
        )}

        <EditFormItem
          style={{ flex: 1 }}
          label="Сервіс (грн/м²)"
          name="servicePricePerMeter"
          loading={loading}
          noStyle={!editable}
        >
          {editable ? (
            <Input
              type="number"
              placeholder="Вкажіть значення..."
              disabled={disabled}
            />
          ) : (
            servicePricePerMeter
          )}
        </EditFormItem>
      </div>
    </Form.Item>
  )
}

const Part: React.FC<EditFormAttributeProps> = ({
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
        <EditFormItem
          style={{ flex: 1 }}
          label="Загальної площі"
          name="rentPart"
          loading={loading}
          noStyle={!editable}
        >
          {editable ? (
            <Input
              type="number"
              placeholder="Вкажіть значення..."
              disabled={disabled}
            />
          ) : (
            rentPart
          )}
        </EditFormItem>

        {!editable && (
          <Divider type="vertical" style={{ height: 64, margin: '0 8px' }} />
        )}

        <EditFormItem
          style={{ flex: 1 }}
          label="Водопостачання"
          name="waterPart"
          loading={loading}
          noStyle={!editable}
        >
          {editable ? (
            <Input
              type="number"
              placeholder="Вкажіть значення..."
              disabled={disabled}
            />
          ) : (
            waterPart
          )}
        </EditFormItem>
      </div>
    </Form.Item>
  )
}

const Cleaning: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const cleaning: number | undefined = Form.useWatch('cleaning', form)

  return (
    <EditFormItem
      label="Прибирання (грн)"
      name="cleaning"
      loading={loading}
      noStyle={!editable}
    >
      {editable ? (
        <Input
          type="number"
          placeholder="Вкажіть значення..."
          disabled={disabled}
        />
      ) : (
        cleaning
      )}
    </EditFormItem>
  )
}

const Discount: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const discount: number | undefined = Form.useWatch('discount', form)

  return (
    <EditFormItem
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
      loading={loading}
      noStyle={!editable}
    >
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
    </EditFormItem>
  )
}

const InflicionAndGarbageCollector: React.FC<EditFormAttributeProps> = ({
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
      <EditFormItem
        style={{ flex: 1 }}
        label="Вивіз ТПВ"
        name="garbageCollector"
        valuePropName="checked"
        loading={loading}
        noStyle={!editable}
      >
        <Checkbox disabled={disabled || !editable} />
      </EditFormItem>

      {!editable && (
        <Divider type="vertical" style={{ height: 64, margin: '0 8px' }} />
      )}

      <EditFormItem
        style={{ flex: 1 }}
        label="Інфляція"
        name="inflicion"
        valuePropName="checked"
        loading={loading}
        noStyle={!editable}
      >
        <Checkbox disabled={disabled || !editable} />
      </EditFormItem>
    </div>
  )
}
