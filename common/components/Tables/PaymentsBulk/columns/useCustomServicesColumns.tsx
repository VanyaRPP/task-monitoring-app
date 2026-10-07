import { ICustomDomainService } from '@common/api/customServicesApi/customServices.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { defaultServices } from '@utils/constants'
import { Form, InputNumber, TableColumnsType } from 'antd'
import { useMemo } from 'react'
import { Amount } from '../cells/Amount'
import { resolveTypedServiceTariff } from '../invoice/typedServiceTariff'
import { applyCustomColumnGate, buildTypedCustomColumn } from './column.config'

export type DomainCustomService = ICustomDomainService['services'][number]

export type CompanyGate = { serviceKey: string; fieldName?: string }

type BuiltColumn = {
  column: TableColumnsType[number] | null
  /** Є, якщо комірки показуються лише компаніям, що мають послугу. */
  gate?: CompanyGate
}

const gateAndKey = (
  column: TableColumnsType[number] | null,
  s: DomainCustomService,
  gateOpts: CompanyGate
): BuiltColumn => {
  const gated = applyCustomColumnGate(column, s, gateOpts)
  return {
    column: gated ? { ...gated, key: gateOpts.serviceKey } : gated,
    // applyCustomColumnGate повертає ту саму колонку, якщо гейт не потрібен.
    gate: gated && gated !== column ? gateOpts : undefined,
  }
}

const buildCustomServiceColumn = (
  s: DomainCustomService,
  service: IService | null | undefined
): BuiltColumn => {
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
  if (typedColumn) return gateAndKey(typedColumn, s, gateOpts)

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
  return gateAndKey(genericColumn, s, gateOpts)
}

/**
 * Колонки кастомних (не вбудованих) послуг домену, їхні підписи для меню та
 * гейти «компанія має послугу» (ключ колонки -> гейт).
 */
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

  const { columns, gates } = useMemo(() => {
    const built = customServices.map((s) =>
      buildCustomServiceColumn(s, service)
    )
    const gates: Record<string, CompanyGate> = {}
    built.forEach(({ column, gate }) => {
      if (column && gate) gates[String(column.key)] = gate
    })
    return {
      columns: built.map(({ column }) => column) as TableColumnsType,
      gates,
    }
  }, [customServices, service])

  const labels = useMemo(
    () =>
      Object.fromEntries(
        customServices.map((s) => [String(s._id), s.name ?? ''])
      ) as Record<string, string>,
    [customServices]
  )

  return { columns, labels, gates }
}
