import { useGetDomainQuery } from '@common/api/domainApi/domain.api'
import {
  useAddPaymentMutation,
  useEditPaymentMutation,
  useGetPaymentQuery,
} from '@common/api/paymentApi/payment.api'
import { useGetRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetServiceQuery } from '@common/api/serviceApi/service.api'
import { useGetStreetQuery } from '@common/api/streetApi/street.api'
import { dateToDefaultFormat } from '@common/assets/features/formatDate'
import {
  EditFormAttributeProps,
  EditFormItem,
  EditFormProps,
} from '@common/components/Forms'
import { DividedSpace } from '@common/components/UI/DividedSpace'
import { Loading } from '@common/components/UI/Loading'
import { CompanySelect } from '@common/components/UI/Selectors/CompanySelect'
import { DomainSelect } from '@common/components/UI/Selectors/DomainSelect'
import { ServiceSelect } from '@common/components/UI/Selectors/ServiceSelect'
import { StreetSelect } from '@common/components/UI/Selectors/StreetSelect'
import { IDomain } from '@common/modules/models/Domain'
import { IPayment } from '@common/modules/models/Payment'
import { IRealEstate } from '@common/modules/models/RealEstate'
import { IService } from '@common/modules/models/Service'
import { IStreet } from '@common/modules/models/Street'
import { Form, Input, Tabs, message } from 'antd'
import React, { useCallback, useEffect, useMemo } from 'react'

export interface EditPaymentFormProps extends EditFormProps<IPayment> {
  payment?: IPayment['_id']
  domain?: IDomain['_id']
  street?: IStreet['_id']
  company?: IRealEstate['_id']
  service?: IService['_id']
}

/**
 * Create/edit payment form
 *
 * @param form - form instance (to use controls from parent component, such as `form.submit()`)
 * @param payment - editing payment id (leave empty to create new payment)
 * @param domain - default domain id
 * @param street - default street id
 * @param company - default company id
 * @param service - default service id
 * @param editable - describes is form read-only or can be edited (default - `true`)
 * @param onFinish - callback executed on successfull form submit
 * @param onFinishFailed - callback executed on error appeared when form submit
 * @param ...props - rest of `antd#Form` props
 */
export const EditPaymentForm: React.FC<EditPaymentFormProps> = ({
  form: _form,
  payment: paymentId,
  domain: domainId,
  street: streetId,
  company: companyId,
  service: serviceId,
  editable = true,
  onFinish,
  onFinishFailed,
  ...props
}) => {
  // const editable = false

  const [form] = Form.useForm(_form)

  const { data: payment, isLoading: isPaymentLoading } = useGetPaymentQuery(
    paymentId,
    { skip: !paymentId }
  )
  const [addPayment, { isLoading: isAddLoading }] = useAddPaymentMutation()
  const [editPayment, { isLoading: isEditLoading }] = useEditPaymentMutation()

  const isLoading = isPaymentLoading || isEditLoading || isAddLoading

  const handleFinish = useCallback(
    async (fields: any) => {
      try {
        const response = payment
          ? await editPayment({
              _id: payment._id,
              ...fields,
            })
          : await addPayment(fields)

        if ('data' in response) {
          if (paymentId && payment) {
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
    [paymentId, payment, onFinish, onFinishFailed, editPayment, addPayment]
  )

  useEffect(() => {
    if (paymentId && payment) {
      form.setFieldsValue({
        ...payment,
        domain: payment?.domain?._id,
        street: payment?.street?._id,
        company: payment?.company?._id,
        monthService: payment?.monthService?._id,
      })
    } else {
      form.resetFields()
    }
  }, [form, paymentId, payment])

  return (
    <Form
      onFinish={handleFinish}
      form={form}
      layout="vertical"
      requiredMark={editable}
      initialValues={{
        domain: domainId,
        street: streetId,
        company: companyId,
        monthService: serviceId,
      }}
      {...props}
    >
      <DividedSpace direction="vertical" hidden={editable}>
        <Domain form={form} loading={isLoading} editable={editable} />
        <Street form={form} loading={isLoading} editable={editable} />
        <Company form={form} loading={isLoading} editable={editable} />
        <Service form={form} loading={isLoading} editable={editable} />
        <Prices form={form} loading={isLoading} editable={editable} />
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
  const domainId: string | undefined = Form.useWatch('domain', form)

  const { data: domain, isLoading: isDomainLoading } = useGetDomainQuery(
    domainId,
    { skip: !domainId }
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
        <DomainSelect disabled={disabled} />
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

  // useEffect(() => {
  //   form.setFieldValue('street', null)
  // }, [form, domainId])

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

const Company: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const companyId: string | undefined = Form.useWatch('company', form)
  const streetId: string | undefined = Form.useWatch('street', form)
  const domainId: string | undefined = Form.useWatch('domain', form)

  const { data: company, isLoading: isCompanyLoading } = useGetRealEstateQuery(
    companyId,
    { skip: !companyId || editable }
  )

  // useEffect(() => {
  //   form.setFieldValue('company', null)
  // }, [form, domainId, streetId])

  return (
    <EditFormItem
      label="Компанія"
      name="company"
      rules={[{ required: true, message: `Поле обов'язкове` }]}
      loading={loading}
      noStyle={!editable}
      required
    >
      {editable ? (
        <CompanySelect
          domain={domainId}
          street={streetId}
          disabled={disabled || !domainId || !streetId}
        />
      ) : (
        <Loading loading={isCompanyLoading}>{company?.companyName}</Loading>
      )}
    </EditFormItem>
  )
}

const Service: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const serviceId: string | undefined = Form.useWatch('monthService', form)
  const streetId: string | undefined = Form.useWatch('street', form)
  const domainId: string | undefined = Form.useWatch('domain', form)

  const { data: service, isLoading: isServiceLoading } = useGetServiceQuery(
    serviceId,
    { skip: !serviceId || editable }
  )

  const date: string = useMemo(
    () => (service?.date ? dateToDefaultFormat(service.date.toString()) : ''),
    [service?.date]
  )

  // useEffect(() => {
  //   form.setFieldValue('monthService', null)
  // }, [form, domainId, streetId])

  return (
    <EditFormItem
      label="Послуга"
      name="monthService"
      rules={[{ required: true, message: `Поле обов'язкове` }]}
      loading={loading}
      noStyle={!editable}
      required
    >
      {editable ? (
        <ServiceSelect
          domain={domainId}
          street={streetId}
          disabled={disabled || !domainId || !streetId}
        />
      ) : (
        <Loading loading={isServiceLoading}>від {date}</Loading>
      )}
    </EditFormItem>
  )
}

const Prices: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const type: 'debit' | 'credit' = Form.useWatch('type', form) || 'debit'

  if (!editable && type === 'debit') {
    return (
      <Debit
        form={form}
        loading={loading}
        editable={editable}
        disabled={disabled}
      />
    )
  }

  if (!editable && type === 'credit') {
    return (
      <Credit
        form={form}
        loading={loading}
        editable={editable}
        disabled={disabled}
      />
    )
  }

  return (
    <Form.Item name="type" noStyle>
      <Tabs defaultActiveKey={type}>
        <Tabs.TabPane tab="Дебет" tabKey="debit" key="debit">
          <Debit
            form={form}
            loading={loading}
            editable={editable}
            disabled={disabled}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Кредит" tabKey="credit" key="credit">
          <Credit
            form={form}
            loading={loading}
            editable={editable}
            disabled={disabled}
          />
        </Tabs.TabPane>
      </Tabs>
    </Form.Item>
  )
}

const Credit: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  return (
    <EditFormItem
      label="Кредит"
      name="generalSum"
      rules={[{ required: true, message: `Поле обов'язкове` }]}
      loading={loading}
      noStyle={!editable}
      required
    >
      <Input
        type="number"
        placeholder="Вкажіть значення..."
        disabled={disabled}
        suffix="грн"
      />
    </EditFormItem>
  )
}

const Debit: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  return (
    <EditFormItem
      label="Дебет"
      rules={[{ required: true, message: `Поле обов'язкове` }]}
      loading={loading}
      noStyle={!editable}
      required
    >
      {/* TODO: make PaymentPricesTable analog */}
      {/* <PaymentPricesTable loading={loading} preview={!editable || disabled} /> */}
      <Form.List name="invoice">
        {(fields, { add, remove, move }) => <></>}
      </Form.List>
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
