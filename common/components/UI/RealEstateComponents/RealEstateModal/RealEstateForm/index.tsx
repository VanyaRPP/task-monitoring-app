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

interface Props {
  form: FormInstance<any>
  currentRealEstate?: IExtendedRealestate
  editable?: boolean
  setIsValueChanged: (value: boolean) => void
}

const RealEstateForm: FC<Props> = ({
  form,
  currentRealEstate,
  editable = true,
  setIsValueChanged,
}) => {
  const domainId = Form.useWatch('domain', form)

  const {
    data: domain = {} as IDomain,
    isLoading: isDomainLoading,
    isError: isDomainError,
  } = useGetDomainByPkQuery({ domainId })

  useEffect(() => {
    if (domain && domain.domainServices) {
      const servicesWithEnabled = domain.domainServices.map((service) => ({
        ...service,
        enabled: true,
      }))

      form.setFieldsValue({
        ...form.getFieldsValue(),
        services: servicesWithEnabled,
      })
    }
  }, [domain, form])

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
      <EmailSelect form={form} disabled={!editable} />
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
      <Form.Item name="rentPart" label="Частка загальної площі">
        <InputNumber
          parser={inputNumberParser}
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="waterPart" label="Частка водопостачання">
        <InputNumber
          parser={inputNumberParser}
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="cleaning" label="Прибирання (грн)">
        <InputNumber
          parser={inputNumberParser}
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
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
      <Form.Item
        valuePropName="checked"
        name="inflicion"
        label="Індекс інфляції"
      >
        <Checkbox disabled={!editable} />
      </Form.Item>

      <Form.List name="services">
        {(fields, { add, remove }) => (
          <div style={{ display: 'flex', rowGap: 16, flexDirection: 'column' }}>
            {fields.map((field, index) => (
              <Card
                key={JSON.stringify(field.key)}
                size="small"
                title={
                  <Flex justify={'space-between'} align={'center'}>
                    <Typography>Послуга {index + 1}</Typography>
                    <Form.Item
                      name={[field.name, 'enabled']}
                      valuePropName="checked"
                      initialValue={true}
                    >
                      <Checkbox disabled={!editable} />
                    </Form.Item>
                  </Flex>
                }
                aria-disabled={!editable}
              >
                <Form.Item label="Найменування" name={[field.name, 'name']}>
                  <Input placeholder="Найменування послуги" disabled />
                </Form.Item>

                <Form.Item label="Ціна" name={[field.name, 'price']}>
                  <Input placeholder="Ціна послуги" disabled />
                </Form.Item>
              </Card>
            ))}
          </div>
        )}
      </Form.List>
    </Form>
  )
}

export default RealEstateForm
