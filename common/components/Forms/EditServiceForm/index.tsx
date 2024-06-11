import { useGetDomainQuery } from '@common/api/domainApi/domain.api'
import {
  useAddServiceMutation,
  useEditServiceMutation,
  useGetServiceQuery,
} from '@common/api/serviceApi/service.api'
import { useGetStreetQuery } from '@common/api/streetApi/street.api'
import {
  EditFormAttributeProps,
  EditFormItem,
  EditFormProps,
} from '@common/components/Forms'
import { DividedSpace } from '@common/components/UI/DividedSpace'
import { Loading } from '@common/components/UI/Loading'
import { DomainSelect } from '@common/components/UI/Selectors/DomainSelect'
import { StreetSelect } from '@common/components/UI/Selectors/StreetSelect'
import { IDomain } from '@common/modules/models/Domain'
import { IService } from '@common/modules/models/Service'
import { IStreet } from '@common/modules/models/Street'
import { NumberToFormattedMonth } from '@utils/helpers'
import { DatePicker, Form, Input, message } from 'antd'
import moment, { Moment } from 'moment'
import React, { useCallback, useEffect, useMemo } from 'react'

export interface EditServiceFormProps extends EditFormProps<IService> {
  service?: IService['_id']
  domain?: IDomain['_id']
  street?: IStreet['_id']
}

/**
 * Create/edit service form
 *
 * @param form - form instance (to use controls from parent component, such as `form.submit()`)
 * @param service - editing service id (leave empty to create new service)
 * @param domain - default domain id
 * @param street - default street id
 * @param editable - describes is form read-only or can be edited (default - `true`)
 * @param onFinish - callback executed on successfull form submit
 * @param onFinishFailed - callback executed on error appeared when form submit
 * @param ...props - rest of `antd#Form` props
 */
export const EditServiceForm: React.FC<EditServiceFormProps> = ({
  form: _form,
  service: serviceId,
  domain: domainId,
  street: streetId,
  editable = true,
  onFinish,
  onFinishFailed,
  ...props
}) => {
  const [form] = Form.useForm(_form)

  const { data: service, isLoading: isServiceLoading } = useGetServiceQuery(
    serviceId,
    { skip: !serviceId }
  )
  const [addService, { isLoading: isAddLoading }] = useAddServiceMutation()
  const [editService, { isLoading: isEditLoading }] = useEditServiceMutation()

  const isLoading = isServiceLoading || isEditLoading || isAddLoading

  const handleFinish = useCallback(
    async (fields: any) => {
      try {
        const data = {
          ...fields,
          date: fields.date.toDate(),
        }

        const response = service
          ? await editService({
              _id: service._id,
              ...data,
            })
          : await addService(data)

        if ('data' in response) {
          if (serviceId && service) {
            message.success('Зміни для послуги збережено')
          } else {
            message.success('Послугу успішно додано')
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
    [serviceId, service, onFinish, onFinishFailed, editService, addService]
  )

  useEffect(() => {
    if (serviceId && service) {
      form.setFieldsValue({
        ...service,
        street: service?.street._id,
        domain: service?.domain._id,
        date: moment(service?.date),
      })
    } else {
      form.resetFields()
    }
  }, [form, serviceId, service])

  return (
    <Form
      onFinish={handleFinish}
      form={form}
      layout="vertical"
      requiredMark={editable}
      {...props}
    >
      <DividedSpace direction="vertical" hidden={editable}>
        <Domain form={form} loading={isLoading} editable={editable} />
        <Street form={form} loading={isLoading} editable={editable} />
        <Month form={form} loading={isLoading} editable={editable} />
        <Prices
          form={form}
          loading={isLoading}
          editable={editable}
          fields={[
            { name: 'waterPrice', label: 'Вода', required: true },
            { name: 'waterPriceTotal', label: 'Вода???', required: true },
            {
              name: 'electricityPrice',
              label: 'Електропостачання',
              required: true,
            },
          ]}
        />
        <Prices
          form={form}
          loading={isLoading}
          editable={editable}
          fields={[
            { name: 'rentPrice', label: 'Утримання', required: true },
            {
              name: 'garbageCollectorPrice',
              label: 'Вивіз ТПВ',
              required: false,
            },
            {
              name: 'inflicionPrice',
              label: 'Індекс інфляції',
              required: false,
            },
          ]}
        />
        <Description form={form} loading={isLoading} editable={editable} />
      </DividedSpace>
    </Form>
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

const Month: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const date: Moment | undefined = Form.useWatch('date', form)

  const month: string = useMemo(
    () => (date ? NumberToFormattedMonth(date.month()) : ''),
    [date]
  )

  return (
    <EditFormItem
      label="Місяць"
      name="date"
      rules={[{ required: true, message: `Поле обов'язкове` }]}
      loading={loading}
      noStyle={!editable}
      required
    >
      {editable ? (
        // uses moment internally :(
        <DatePicker.MonthPicker
          style={{ width: '100%' }}
          placeholder="Оберіть місяць..."
          format="MMMM YYYY"
          disabled={disabled}
        />
      ) : (
        month
      )}
    </EditFormItem>
  )
}

const Prices: React.FC<
  EditFormAttributeProps & {
    fields: { name: keyof IService; label: string; required: boolean }[]
  }
> = ({ form, loading, disabled, editable, fields }) => {
  return (
    <DividedSpace
      direction="horizontal"
      hidden={editable}
      style={{ width: '100%' }}
    >
      {fields.map((field, index) => (
        <Price
          key={index}
          form={form}
          loading={loading}
          editable={editable}
          disabled={disabled}
          name={field.name}
          label={field.label}
          required={field.required}
        />
      ))}
    </DividedSpace>
  )
}

const Price: React.FC<
  EditFormAttributeProps & {
    name: keyof IService
    label: string
    required: boolean
  }
> = ({ form, loading, disabled, editable, name, label, required }) => {
  const value: number | undefined = Form.useWatch(name, form)

  return (
    <EditFormItem
      label={label}
      name={name}
      loading={loading}
      noStyle={!editable}
      required={required}
      rules={[{ required: required, message: "Поле обов'язкове" }]}
    >
      {editable ? (
        <Input
          type="number"
          placeholder="Вкажіть значення..."
          disabled={disabled}
        />
      ) : (
        value
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
          placeholder="Введіть опис"
          disabled={disabled}
        />
      ) : (
        description
      )}
    </EditFormItem>
  )
}
