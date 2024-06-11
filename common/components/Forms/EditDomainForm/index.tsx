import {
  useAddDomainMutation,
  useEditDomainMutation,
  useGetDomainQuery,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import { useGetStreetsQuery } from '@common/api/streetApi/street.api'
import { EditFormAttributeProps, EditFormProps } from '@common/components/Forms'
import { IDomain } from '@common/modules/models/Domain'
import { IStreet } from '@common/modules/models/Street'
import { Form, FormInstance, Input, Select, Spin, Tag, message } from 'antd'
import { useCallback, useEffect } from 'react'

export interface EditDomainFormProps extends EditFormProps<IDomain> {
  form?: FormInstance
  domain?: IDomain['_id']
  streets?: IStreet['_id'][]
}

/**
 * Create/edit domain form
 *
 * @param form - form instance (to use controls from parent component, such as `form.submit()`)
 * @param domain - editing domain id (leave empty to create new domain)
 * @param streets - default street id's
 * @param editable - describes is form read-only or can be edited (default - `true`)
 * @param onFinish - callback executed on successfull form submit
 * @param onFinishFailed - callback executed on error appeared when form submit
 * @param ...props - rest of `antd#Form` props
 */
export const EditDomainForm: React.FC<EditDomainFormProps> = ({
  form: _form,
  domain: domainId,
  streets: streetsIds,
  editable = true,
  onFinish,
  onFinishFailed,
  ...props
}) => {
  const [form] = Form.useForm(_form)

  const { data: domain, isLoading: isDomainLoading } = useGetDomainQuery(
    domainId,
    { skip: !domainId }
  )
  const [addDomain, { isLoading: isAddLoading }] = useAddDomainMutation()
  const [editDomain, { isLoading: isEditLoading }] = useEditDomainMutation()

  const isLoading = isDomainLoading || isEditLoading || isAddLoading

  const handleFinish = useCallback(
    async (fields: any) => {
      try {
        const response = domain
          ? await editDomain({
              _id: domain._id,
              ...fields,
            })
          : await addDomain(fields)

        if ('data' in response) {
          if (domainId && domain) {
            message.success('Зміни для надавача послуг збережено')
          } else {
            message.success('Надавача послуг успішно додано')
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
    [domainId, domain, onFinish, onFinishFailed, editDomain, addDomain]
  )

  useEffect(() => {
    if (domainId && domain) {
      form.setFieldsValue({
        ...domain,
        streets: domain.streets.map(({ _id }) => _id),
      })
    } else {
      form.resetFields()
    }
  }, [form, domainId, domain])

  return (
    <Form
      onFinish={handleFinish}
      initialValues={{ streets: streetsIds }}
      form={form}
      layout="vertical"
      requiredMark={editable}
      {...props}
    >
      <Name form={form} loading={isLoading} editable={editable} />
      <Description form={form} loading={isLoading} editable={editable} />
      <AdminEmails form={form} loading={isLoading} editable={editable} />
      <Streets form={form} loading={isLoading} editable={editable} />
    </Form>
  )
}

const Name: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const name = Form.useWatch('name', form)

  return (
    <Form.Item
      label="Назва"
      name="name"
      required
      rules={[{ required: true, message: `Поле "Назва" обов'язкове` }]}
    >
      {loading ? (
        <Spin />
      ) : editable ? (
        <Input placeholder="Введіть назву" disabled={disabled} />
      ) : (
        <Form.Item noStyle>{name}</Form.Item>
      )}
    </Form.Item>
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
    <Form.Item label="Опис" name="description">
      {loading ? (
        <Spin />
      ) : editable ? (
        <Input.TextArea
          rows={3}
          placeholder="Введіть опис"
          disabled={disabled}
        />
      ) : (
        <Form.Item noStyle>{description}</Form.Item>
      )}
    </Form.Item>
  )
}

const AdminEmails: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const adminEmails: string[] | undefined = Form.useWatch('adminEmails', form)

  const { data: allDomains, isLoading: isAllDomainsLoading } =
    useGetDomainsQuery({})

  return (
    <Form.Item
      label="Адреси представників"
      name="adminEmails"
      required
      rules={[
        { required: true, message: `Поле "Адреси представників" обов'язкове` },
      ]}
    >
      {loading ? (
        <Spin />
      ) : editable ? (
        <Select
          mode="tags"
          placeholder="Оберіть елекронні адреси"
          disabled={disabled}
          loading={isAllDomainsLoading}
          showSearch
          allowClear
          optionFilterProp="text"
          options={allDomains?.filter.adminEmails}
        />
      ) : (
        <Form.Item noStyle>
          {adminEmails?.map((adminEmail) => (
            <Tag key={adminEmail}>{adminEmail}</Tag>
          ))}
        </Form.Item>
      )}
    </Form.Item>
  )
}

const Streets: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const streets: string[] | undefined = Form.useWatch('streets', form)
  const { data: allStreets, isLoading: isAllStreetsLoading } =
    useGetStreetsQuery({})

  return (
    <Form.Item
      label="Закріплені вулиці"
      name="streets"
      required
      rules={[
        { required: true, message: `Поле "Закріплені вулиці" обов'язкове` },
      ]}
    >
      {loading ? (
        <Spin />
      ) : editable ? (
        <Select
          mode="multiple"
          placeholder="Оберіть адреси"
          loading={isAllStreetsLoading}
          disabled={disabled}
          showSearch
          allowClear
          optionFilterProp="label"
          options={allStreets?.data.map((street) => ({
            label: `вул. ${street.address} (м. ${street.city})`,
            value: street._id,
          }))}
        />
      ) : (
        <Form.Item noStyle>
          {streets?.map((street) => {
            const streetData = allStreets?.data.find(
              ({ _id }) => street === _id
            )

            if (!streetData) {
              return (
                <Tag key={street} color="red">
                  Unknown
                </Tag>
              )
            }

            return (
              <Tag key={street}>
                вул. {streetData.address} (м. {streetData.city})
              </Tag>
            )
          })}
        </Form.Item>
      )}
    </Form.Item>
  )
}
