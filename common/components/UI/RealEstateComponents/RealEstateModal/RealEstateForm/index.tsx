/* eslint-disable @typescript-eslint/no-empty-function */
import { validateField } from '@assets/features/validators'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import EmailSelect from '@components/UI/Reusable/EmailSelect'
import {
  Checkbox,
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Select,
  Tabs,
  Typography,
} from 'antd'
import type { TabsProps } from 'antd'
import { FC, useEffect, useState } from 'react'
import AddressesSelect from '../../../Reusable/AddressesSelect'
import DomainsSelect from '../../../Reusable/DomainsSelect'
import s from './style.module.scss'
import { useGetDomainByPkQuery } from '@common/api/domainApi/domain.api'
import { IDomain } from '@modules/models/Domain'
import { inputNumberParser } from '@utils/helpers'
import { CURRENCY_SELECT_OPTIONS, Currency } from '@utils/constants'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import CustomServicesCard from '../../../CustomServicesCard'

interface Props {
  form: FormInstance<any>
  currentRealEstate?: IExtendedRealestate
  editable?: boolean
  setIsValueChanged: (value: boolean) => void
  customServices?: any[]
  preselectedStreet?: string
}

const RealEstateForm: FC<Props> = ({
  form,
  currentRealEstate,
  editable = true,
  setIsValueChanged,
  customServices = [],
  preselectedStreet,
}) => {
  const watchedDomainId = Form.useWatch('domain', form)
  const domainId = watchedDomainId || currentRealEstate?.domain?._id
  const { data: domain = {} as IDomain } = useGetDomainByPkQuery(
    { domainId: domainId || currentRealEstate?.domain?._id },
    { skip: !domainId && !currentRealEstate?.domain?._id }
  )

  const { data: servicesData } = useGetAllServicesQuery({
    domainId: domain?._id || currentRealEstate?.domain?._id,
  })
  const services = servicesData?.data

  useEffect(() => {
    if (services) {
      const servicesWithEnabled = services.map((service) => ({
        ...service,
        enabled: true,
      }))
      form.setFieldValue('services', servicesWithEnabled)
    }
  }, [services, currentRealEstate, form])

  const isServiceExistById = (serviceId: string) => {
    if (!domain?.customServices?.length) return false
    return domain.customServices.some((group) =>
      group.services?.includes(serviceId)
    )
  }

  const isServiceExist = (value: string) => {
    if (!domain?._id || !services || !services?.length) return false
    const existedValues = services.map((x) => !!x[value])
    return existedValues.includes(true)
  }

  const isMeterBasedServiceExist =
    isServiceExistById('677d414283b6ef93c6b8ea2c') ||
    isServiceExistById('682dd48d9665126611c81950')

  const getSafeStreetId = () => {
    const val =
      typeof currentRealEstate?.street === 'object' &&
      currentRealEstate?.street !== null
        ? currentRealEstate.street._id
        : currentRealEstate?.street
    return val && /^[0-9a-fA-F]{24}$/.test(String(val)) ? val : undefined
  }

  const renderMainInfo = () => (
    <>
      <DomainsSelect form={form} edit={!!currentRealEstate} />
      <Form.Item
        name="street"
        hidden
        normalize={(value) =>
          typeof value === 'object' && value !== null ? value._id : value
        }
      >
        <Input />
      </Form.Item>

      <AddressesSelect
        form={form}
        key={domainId}
        street={preselectedStreet}
        required={false}
        edit={!!currentRealEstate}
      />

      <Form.Item
        name="companyName"
        label="Назва компанії"
        rules={validateField('required')}
      >
        <Input
          placeholder="Назва компанії"
          maxLength={256}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item
        name="description"
        label="Опис"
        rules={validateField('required')}
      >
        <Input.TextArea
          rows={4}
          placeholder="Опис"
          maxLength={512}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>

      <Form.Item
        name="currency"
        label="Валюта"
        rules={validateField('required')}
      >
        <Select
          placeholder="Оберіть валюту"
          className={s.formInput}
          options={CURRENCY_SELECT_OPTIONS}
          disabled={!editable}
        />
      </Form.Item>
      <EmailSelect form={form} disabled={!editable} required={false} />

      {isMeterBasedServiceExist && (
        <>
          <Form.Item
            name="totalArea"
            label="Площа (м²)"
            rules={validateField('required')}
          >
            <InputNumber
              parser={inputNumberParser}
              placeholder="Вкажіть значення"
              className={s.formInput}
              disabled={!editable}
            />
          </Form.Item>
          <Form.Item
            name="pricePerMeter"
            label="Ціна (грн/м²)"
            rules={validateField('required')}
          >
            <InputNumber
              parser={inputNumberParser}
              placeholder="Вкажіть значення"
              className={s.formInput}
              disabled={!editable}
            />
          </Form.Item>
        </>
      )}

      {isServiceExist('inflicionPrice') && (
        <Form.Item
          valuePropName="checked"
          name="inflicion"
          label="Індекс інфляції"
        >
          <Checkbox disabled={!editable} />
        </Form.Item>
      )}
    </>
  )

  const renderContract = () => (
    <>
      <div style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">
          Номер договору з цією компанією. Використовується в акті надання
          послуг.
        </Typography.Text>
      </div>
      <Form.Item name="contractNumber" label="Номер договору">
        <Input
          placeholder="Наприклад, 15"
          maxLength={64}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="contractDate" label="Дата договору">
        <DatePicker
          format="DD.MM.YYYY"
          placeholder="Оберіть дату"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
    </>
  )

  const renderServices = () => (
    <>
      <div style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">
          Оберіть послуги, які будуть доступні для цієї компанії, та вкажіть
          їхню вартість.
        </Typography.Text>
      </div>
      <Form.Item style={{ marginBottom: 0 }}>
        <CustomServicesCard
          form={form}
          disabled={!editable}
          allCustomServices={customServices}
          skipAutoPopulate={!!currentRealEstate}
        />
      </Form.Item>
    </>
  )

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: 'Основна інформація',
      children: renderMainInfo(),
    },
    {
      key: '2',
      label: 'Послуги',
      children: renderServices(),
    },
    {
      key: '3',
      label: 'Договір',
      children: renderContract(),
    },
  ]

  return (
    <Form
      form={form}
      requiredMark={editable}
      layout="vertical"
      className={s.Form}
      onValuesChange={() => setIsValueChanged(true)}
      initialValues={{
        currency: currentRealEstate?.currency || Currency.UAH,
        street: getSafeStreetId(),
      }}
    >
      <Tabs defaultActiveKey="1" items={tabItems} />
    </Form>
  )
}

export default RealEstateForm
