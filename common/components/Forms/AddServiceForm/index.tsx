import { validateField } from '@assets/features/validators'
import { IService } from '@common/api/serviceApi/service.api.types'
import AddressesSelect from '@components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import { usePreviousMonthService } from '@modules/hooks/useService'
import {
  ConfigProvider,
  DatePicker,
  Form,
  FormInstance,
  Input,
} from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { useEffect, useState, useMemo } from 'react'
import s from './style.module.scss'
import { inputNumberParser } from '@utils/helpers'
import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import CustomServicesCard from '@components/UI/CustomServicesCard'
import { LossesCollapse } from '@components/Losses/LossesCollapse'

dayjs.locale('uk')

interface Props {
  form: FormInstance<any>
  edit: boolean
  currentService: IService
  setIsValueChanged: (value: boolean) => void
}

const AddServiceForm: React.FC<Props> = ({
  form,
  edit,
  currentService,
  setIsValueChanged,
}) => {
  const { MonthPicker } = DatePicker

  const date = Form.useWatch('date', form)
  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)

  const filteredServicesPrice = (customServices) => {
    return customServices?.map((service) => {
      let price = null

      switch (service.fieldName) {
        case 'electricityPrice':
          price =
            currentService?.electricityPrice ??
            currentService?.customServices?.find(
              (service) => service.fieldName === 'electricityPrice'
            )?.price ??
            0
          break
        case 'inflicionPrice':
          price =
            currentService?.inflicionPrice ??
            currentService?.customServices?.find(
              (service) => service.fieldName === 'inflicionPrice'
            )?.price ??
            0
          break
        case 'rentPrice':
          price =
            currentService?.rentPrice ??
            currentService?.customServices?.find(
              (service) => service.fieldName === 'rentPrice'
            )?.price ??
            0
          break
        case 'waterPrice':
          price =
            currentService?.waterPrice ??
            currentService?.customServices?.find(
              (service) => service.fieldName === 'waterPrice'
            )?.price ??
            0
          break
        case 'waterPriceTotal':
          price =
            currentService?.waterPriceTotal ??
            currentService?.customServices?.find(
              (service) => service.fieldName === 'waterPriceTotal'
            )?.price ??
            0
          break
        case 'garbageCollectorPrice':
          price =
            currentService?.garbageCollectorPrice ??
            currentService?.customServices?.find(
              (service) => service.fieldName === 'garbageCollectorPrice'
            )?.price ??
            0
          break
        default:
          price =
            currentService?.[service?.fieldName] ??
            currentService?.customServices?.find(
              (service) => service?.fieldName === service?.fieldName
            )?.price ??
            0
          break
      }

      return {
        ...service,
        price,
      }
    })
  }

  const { data: customDomainServices } = useGetCustomServicesByDomainQuery(
    { domainId: domainId },
    { skip: !domainId }
  )

  const initialCustomServices = customDomainServices?.data?.flatMap((group) =>
    Array.isArray(group?.services)
      ? group.services.map((service) => ({
          label: service.name || 'Невідома послуга',
          price: 0,
          fieldName: service.fieldName || 'defaultFieldName',
          _id: service._id || 'defaultId',
        }))
      : []
  )

  const filteredCustomServices = filteredServicesPrice(initialCustomServices)

  const { previousMonth } = usePreviousMonthService({
    date,
    domainId,
    streetId,
  })

  useEffect(() => {
    const currentCustomServices = form.getFieldValue('customServices')
      if (!currentCustomServices || currentCustomServices.length === 0) {
      form.setFieldsValue({
        electricityPrice:
          currentService?.electricityPrice ??
          previousMonth?.electricityPrice ??
          0,
        inflicionPrice:
          currentService?.inflicionPrice ?? previousMonth?.inflicionPrice ?? 0,
        rentPrice: currentService?.rentPrice ?? previousMonth?.rentPrice ?? 0,
        waterPrice: currentService?.waterPrice ?? previousMonth?.waterPrice ?? 0,
        waterPriceTotal:
          currentService?.waterPriceTotal ?? previousMonth?.waterPriceTotal ?? 0,
        garbageCollectorPrice:
          currentService?.garbageCollectorPrice ??
          previousMonth?.garbageCollectorPrice ??
          0,
        customServices:
          (currentService?.customServices?.length > 0
            ? currentService.customServices
            : filteredCustomServices) || [],
        losses: currentService?.losses,
        consumedElectricity: currentService?.consumedElectricity ?? null,
        generalElectricity: currentService?.generalElectricity ?? null,
        isVAT: currentService?.isVAT || true,
      })
    }
  }, [form, currentService, previousMonth, initialCustomServices])

  useEffect(() => {
    form.setFields([
      { name: 'consumedElectricity', value: currentService?.consumedElectricity ?? null },
      { name: 'generalElectricity', value: currentService?.generalElectricity ?? null },
      { name: 'isVAT', value: currentService?.isVAT ?? true },
    ])
  }, [currentService, form])

  return (
    <ConfigProvider locale={ukUA}>
      <Form
        form={form}
        layout="vertical"
        className={s.Form}
        initialValues={{
          domain: currentService?.domain?._id,
          street: currentService?.street?._id,
          date: dayjs(currentService?.date),
          description: currentService?.description,
          losses: currentService?.losses,
          consumedElectricity: currentService?.consumedElectricity ?? null,
          generalElectricity: currentService?.generalElectricity ?? null,
          isVAT: currentService?.isVAT || true,
        }}
        onValuesChange={() => setIsValueChanged(true)}
      >
        <DomainsSelect form={form} edit={edit} />
        <AddressesSelect form={form} edit={edit} />
        <Form.Item
          name="date"
          label="Місяць та рік"
          rules={validateField('required')}
        >
          <MonthPicker
            format="MMMM YYYY"
            placeholder="Оберіть місяць"
            className={s.formInput}
          />
        </Form.Item>
        <CustomServicesCard form={form} isServiceForm={true} />
        {/* { !(initialCustomServices ?? []).some(item => item.fieldName === 'rentPrice') && // TODO: customServices
        <Form.Item
          name="rentPrice"
          label="Утримання приміщень (грн/м²)"
          rules={validateField('required')}
        >
          <InputNumber
            parser={inputNumberParser}
            placeholder="Вкажіть значення"
            className={s.formInput}
          />
        </Form.Item>
        }
        { !(initialCustomServices ?? []).some(item => item.fieldName === 'electricityPrice') &&
        <Form.Item
          name="electricityPrice"
          label="Електроенергія (грн/кВт)"
          rules={validateField('electricityPrice')}
        >
          <InputNumber
            parser={inputNumberParser}
            placeholder="Вкажіть значення"
            className={s.formInput}
          />
        </Form.Item>
        }
        { !(initialCustomServices ?? []).some(item => item.fieldName === 'waterPrice') &&
        <Form.Item
          name="waterPrice"
          label="Водопостачання (грн/м³)"
          rules={validateField('required')}
        >
          <InputNumber
            parser={inputNumberParser}
            placeholder="Вкажіть значення"
            className={s.formInput}
          />
        </Form.Item>
        }
        { !(initialCustomServices ?? []).some(item => item.fieldName === 'waterPriceTotal') && 
        <Form.Item
          name="waterPriceTotal"
          label="Всього водопостачання (грн/м³)"
          rules={validateField('required')}
        >
          <InputNumber
            parser={inputNumberParser}
            placeholder="Вкажіть значення"
            className={s.formInput}
          />
        </Form.Item>
        } 
        { !(initialCustomServices ?? []).some(item => item.fieldName === 'garbageCollectorPrice') &&
        <Form.Item name="garbageCollectorPrice" label="Вивіз сміття">
          <InputNumber
            parser={inputNumberParser}
            placeholder="Вкажіть значення"
            className={s.formInput}
          />
        </Form.Item>
        } 
        <Form.Item name="inflicionPrice" label="Індекс інфляції">
          <InputNumber
            parser={inputNumberParser}
            placeholder="Вкажіть значення"
            className={s.formInput}
          />
        </Form.Item> */}
        <LossesCollapse
          form={form}
          name='losses'
        />  
        <br/>
        <br/>
        <Form.Item name="description" label="Опис">
          <Input.TextArea
            placeholder="Введіть опис"
            autoSize={{
              minRows: 2,
              maxRows: 5,
            }}
            maxLength={256}
            className={s.formInput}
          />
        </Form.Item>
      </Form>
    </ConfigProvider>
  )
}

export default AddServiceForm
