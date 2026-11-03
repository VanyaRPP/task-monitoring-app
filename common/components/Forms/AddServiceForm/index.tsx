import { validateField } from '@assets/features/validators'
import { IService } from '@common/api/serviceApi/service.api.types'
import AddressesSelect from '@components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import { usePreviousMonthService } from '@modules/hooks/useService'
import { ConfigProvider, DatePicker, Form, FormInstance, Input } from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { useEffect, useState, useMemo, useRef } from 'react'
import s from './style.module.scss'
import { inputNumberParser } from '@utils/helpers'
import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { useGetInflationIndexesQuery } from '@common/api/inflationIndexApi/inflationIndex.api'
import { formatPeriod } from '@utils/debt-calculation/months'
import { applyInflationDefault } from '@utils/inflation-index/service-defaults'
import CustomServicesCard from '@components/UI/CustomServicesCard'
import { LossesCollapse } from '@components/Losses/LossesCollapse'

dayjs.locale('uk')

interface Props {
  form: FormInstance<any>
  edit: boolean
  currentService: IService
  /**
   * A new service filled in ahead of time (an AI draft): prefills like
   * `currentService` but is not one - it is saved as a new service.
   */
  draft?: Partial<IService>
  setIsValueChanged: (value: boolean) => void
}

const AddServiceForm: React.FC<Props> = ({
  form,
  edit,
  currentService,
  draft,
  setIsValueChanged,
}) => {
  const { MonthPicker } = DatePicker
  // What the fields start from: the service being edited, or a draft.
  const source = (currentService ?? draft) as IService | undefined

  const date = Form.useWatch('date', form)
  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)

  const selectedMonth = date ? dayjs(date) : null
  const period = selectedMonth?.isValid()
    ? formatPeriod({
        year: selectedMonth.year(),
        month: selectedMonth.month() + 1,
      })
    : undefined
  const { data: indexes } = useGetInflationIndexesQuery(
    { from: period, to: period, domainId: domainId || undefined },
    { skip: !period }
  )
  const indexValue =
    indexes?.find((item) => formatPeriod(item) === period)?.value ?? null

  const filteredServicesPrice = (customServices) => {
    return customServices?.map((service) => {
      let price = null

      switch (service.fieldName) {
        case 'electricityPrice':
          price =
            source?.electricityPrice ??
            source?.customServices?.find(
              (service) => service.fieldName === 'electricityPrice'
            )?.price ??
            0
          break
        case 'inflicionPrice':
          price = currentService
            ? (currentService.inflicionPrice ??
              currentService.customServices?.find(
                (service) => service.fieldName === 'inflicionPrice'
              )?.price ??
              0)
            : (draft?.inflicionPrice ?? indexValue)
          break
        case 'rentPrice':
          price =
            source?.rentPrice ??
            source?.customServices?.find(
              (service) => service.fieldName === 'rentPrice'
            )?.price ??
            0
          break
        case 'waterPrice':
          price =
            source?.waterPrice ??
            source?.customServices?.find(
              (service) => service.fieldName === 'waterPrice'
            )?.price ??
            0
          break
        case 'waterPriceTotal':
          price =
            source?.waterPriceTotal ??
            source?.customServices?.find(
              (service) => service.fieldName === 'waterPriceTotal'
            )?.price ??
            0
          break
        case 'garbageCollectorPrice':
          price =
            source?.garbageCollectorPrice ??
            source?.customServices?.find(
              (service) => service.fieldName === 'garbageCollectorPrice'
            )?.price ??
            0
          break
        default:
          price =
            source?.[service?.fieldName] ??
            source?.customServices?.find(
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
          source?.electricityPrice ?? previousMonth?.electricityPrice ?? 0,
        inflicionPrice: source?.inflicionPrice ?? indexValue,
        rentPrice: source?.rentPrice ?? previousMonth?.rentPrice ?? 0,
        waterPrice: source?.waterPrice ?? previousMonth?.waterPrice ?? 0,
        waterPriceTotal:
          source?.waterPriceTotal ?? previousMonth?.waterPriceTotal ?? 0,
        garbageCollectorPrice:
          source?.garbageCollectorPrice ??
          previousMonth?.garbageCollectorPrice ??
          0,
        customServices:
          (source?.customServices?.length > 0
            ? source.customServices
            : filteredCustomServices) || [],
        losses: source?.losses,
        consumedElectricity: source?.consumedElectricity ?? null,
        generalElectricity: source?.generalElectricity ?? null,
        isVAT: source?.isVAT || true,
      })
    }
  }, [form, source, previousMonth, initialCustomServices, indexValue])

  const appliedIndex = useRef<number | null>(null)
  useEffect(() => {
    if (currentService) return

    const rows = form.getFieldValue('customServices')
    if (Array.isArray(rows) && rows.length > 0) {
      const next = applyInflationDefault(rows, indexValue, appliedIndex.current)
      if (next !== rows) form.setFieldsValue({ customServices: next })
    }
    appliedIndex.current = indexValue
  }, [currentService, form, indexValue])

  useEffect(() => {
    form.setFields([
      {
        name: 'consumedElectricity',
        value: source?.consumedElectricity ?? null,
      },
      {
        name: 'generalElectricity',
        value: source?.generalElectricity ?? null,
      },
      { name: 'isVAT', value: source?.isVAT ?? true },
    ])
  }, [source, form])

  return (
    <ConfigProvider locale={ukUA}>
      <Form
        form={form}
        layout="vertical"
        className={s.Form}
        initialValues={{
          domain: source?.domain?._id,
          street: source?.street?._id,
          date: dayjs(source?.date),
          description: source?.description,
          losses: source?.losses,
          consumedElectricity: source?.consumedElectricity ?? null,
          generalElectricity: source?.generalElectricity ?? null,
          isVAT: source?.isVAT || true,
        }}
        onValuesChange={() => setIsValueChanged(true)}
      >
        <DomainsSelect form={form} edit={edit} />
        <AddressesSelect form={form} edit={edit} required={false} />
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
        <LossesCollapse form={form} name="losses" />
        <br />
        <br />
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
