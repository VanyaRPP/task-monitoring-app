import { ICustomDomainService } from '@common/api/customServicesApi/customServices.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { defaultServices } from '@utils/constants'
import { Form, InputNumber, TableColumnsType } from 'antd'
import { useMemo } from 'react'
import { Amount } from '../cells/Amount'
import { resolveTypedServiceTariff } from '../invoice/typedServiceTariff'
import { applyCustomColumnGate, buildTypedCustomColumn } from './column.config'

export type DomainCustomService = ICustomDomainService['services'][number]

const withColumnKey = (
  column: TableColumnsType[number] | null,
  key: string
): TableColumnsType[number] | null => (column ? { ...column, key } : column)

const buildCustomServiceColumn = (
  s: DomainCustomService,
  service: IService | null | undefined
): TableColumnsType[number] | null => {
  // Key each custom column by the service _id, NOT fieldName: two
  // services whose names differ only in parentheses ("електрика(1)")
  // transliterate to the SAME fieldName and would otherwise share inputs.
  const key = String(s._id)

  // A typed custom service (e.g. serviceType === Electricity) renders
  // with the SAME builder as the native communal column of that type.
  // Untyped services keep the plain Кількість/Ціна pair. Whether the
  // cells are hidden on rows whose company lacks the service is decided
  // by applyCustomColumnGate (area-based types render for everyone).
  const gateOpts = { serviceKey: key, fieldName: s.fieldName }

  const typedColumn = buildTypedCustomColumn(s, {
    key,
    losses: service?.losses,
    // Тариф із місячної послуги — для підпису колонки. Індивідуальна
    // ціна компанії враховується вже в рядку кожної компанії.
    price: resolveTypedServiceTariff(
      { service },
      { serviceId: key, fieldName: s.fieldName }
    ),
  })
  if (typedColumn)
    return withColumnKey(applyCustomColumnGate(typedColumn, s, gateOpts), key)

  const genericColumn = {
    title: s.name,
    children: [
      {
        title: 'Кількість',
        width: 120,
        render: (_: any, { name }: { name: number }) => (
          <Amount name={name} fieldName={key} />
        ),
      },
      {
        title: 'Ціна',
        width: 140,
        render: (_: any, { name }: { name: number }) => (
          <Form.Item name={[name, 'invoice', key, 'sum']} style={{ margin: 0 }}>
            <InputNumber placeholder="Ціна" style={{ width: '100%' }} min={0} />
          </Form.Item>
        ),
      },
    ],
  }
  return withColumnKey(applyCustomColumnGate(genericColumn, s, gateOpts), key)
}

/** Колонки кастомних (не вбудованих) послуг домену + їхні підписи для меню. */
export const useCustomServicesColumns = (
  allowedServices: DomainCustomService[],
  service: IService | null | undefined
) => {
  const customServices = useMemo(
    () =>
      allowedServices.filter(
        (s) => !defaultServices.includes(s?._id.toString())
      ),
    [allowedServices]
  )

  const columns = useMemo(
    () =>
      customServices.map((s) =>
        buildCustomServiceColumn(s, service)
      ) as TableColumnsType,
    [customServices, service]
  )

  const labels = useMemo(
    () =>
      Object.fromEntries(
        customServices.map((s) => [String(s._id), s.name ?? ''])
      ) as Record<string, string>,
    [customServices]
  )

  return { columns, labels }
}
