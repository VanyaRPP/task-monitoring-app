/* eslint-disable @typescript-eslint/no-empty-function */
import { validateField } from '@assets/features/validators'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import EmailSelect from '@components/UI/Reusable/EmailSelect'
import {
  Button,
  Card,
  Checkbox,
  Flex,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Typography,
} from 'antd'
import { FC, useEffect } from 'react'
import AddressesSelect from '../../../Reusable/AddressesSelect'
import DomainsSelect from '../../../Reusable/DomainsSelect'
import s from './style.module.scss'
import { useGetDomainByPkQuery } from '@common/api/domainApi/domain.api'
import { IDomain } from '@modules/models/Domain'
import { inputNumberParser } from '@utils/helpers'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import DomainsServices from '@components/UI/DomainsComponents/DomainModal/DomainForm/DomainsServices'
import CustomServicesCard from '../../../CustomServicesCard'

interface Props {
  form: FormInstance<any>
  currentRealEstate?: IExtendedRealestate
  editable?: boolean
  setIsValueChanged: (value: boolean) => void
  customServices?: any[]
}

const RealEstateForm: FC<Props> = ({
  form,
  currentRealEstate,
  editable = true,
  setIsValueChanged,
  customServices = [],
}) => {
  // const domainId = Form.useWatch('domain', form)|| currentRealEstate?.domain?._id
  const domainId = currentRealEstate?.domain?._id
  const streetId = currentRealEstate?.street?._id
  const {
    data: domain = {} as IDomain,
    isLoading: isDomainLoading,
    isError: isDomainError,
  } = useGetDomainByPkQuery(
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

      form.setFieldsValue({
        ...form.getFieldsValue(),
        services: servicesWithEnabled,
      })
    }
  }, [services, form])

  const isServiceExist = (value: string) => {
    if (!domain?._id || !services || !services?.length) return false
    const existedValues = services.map((x) => !!x[value])
    return existedValues.includes(true)
  }

  const latestGarbageService = [...(services ?? [])]
    .filter(
      (s) =>
        s.garbageCollectorPrice &&
        s.garbageCollectorPrice > 0 &&
        String(s.domain?._id) === String(domainId) &&
        String(s.street?._id) === String(streetId)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  return (
    <Form
      form={form}
      requiredMark={editable}
      layout="vertical"
      className={s.Form}
      onValuesChange={() => setIsValueChanged(true)}
    >
      {currentRealEstate ? (
        <Form.Item name="domain" label="Надавач послуг">
          <Input disabled />
        </Form.Item>
      ) : (
        <DomainsSelect form={form} />
      )}
      {currentRealEstate ? (
        <Form.Item name="street" label="Адреса">
          <Input disabled />
        </Form.Item>
      ) : (
        <AddressesSelect form={form} />
      )}
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
      <EmailSelect form={form} disabled={!editable} required={false} />
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

      <CustomServicesCard
        form={form}
        disabled={!editable}
        allCustomServices={customServices}
      />
      {/* { !(customServices ?? []).some(item => item.fieldName === 'rentPrice') && // TODO: customServices */}
      <Form.Item
        name="servicePricePerMeter"
        label="Індивідуальне утримання (грн/м²)"
      >
        <InputNumber
          parser={inputNumberParser}
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      {/* } */}
      <Form.Item name="rentPart" label="Частка загальної площі">
        <InputNumber
          parser={inputNumberParser}
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>

      {isServiceExist('waterPrice') && (
        <Form.Item name="waterPart" label="Частка водопостачання">
          <InputNumber
            parser={inputNumberParser}
            placeholder="Вкажіть значення"
            className={s.formInput}
            disabled={!editable}
          />
        </Form.Item>
      )}
      {/* { !(customServices ?? []).some(item => item.fieldName === 'rentPrice') && */}
      <Form.Item name="cleaning" label="Прибирання (грн)">
        <InputNumber
          parser={inputNumberParser}
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      {/* } */}

      <Form.Item name="discount" label="Знижка">
        <InputNumber
          parser={inputNumberParser}
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>

      <Form.Item
        valuePropName="checked"
        name="garbageCollector"
        label="Вивіз сміття"
      >
        <Checkbox disabled={!editable} />
      </Form.Item>

      {isServiceExist('inflicionPrice') && (
        <Form.Item
          valuePropName="checked"
          name="inflicion"
          label="Індекс інфляції"
        >
          <Checkbox disabled={!editable} />
        </Form.Item>
      )}
    </Form>
  )
}

export default RealEstateForm
