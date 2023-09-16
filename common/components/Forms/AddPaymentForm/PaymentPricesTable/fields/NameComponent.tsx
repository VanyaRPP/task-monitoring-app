import { ServiceType } from '@utils/constants'
import {
  NameGarbageCollectorField,
  NameElectricityField,
  NameMaintainceField,
  NameInflicionField,
  NameWaterPartField,
  NameDiscountField,
  NamePlacingField,
  NameWaterField,
} from './nameFields'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import useCompany from '@common/modules/hooks/useCompany'
import useService from '@common/modules/hooks/useService'
import { getFormattedDate } from '@utils/helpers'
import { Form } from 'antd'

const fields = {
  [ServiceType.GarbageCollector]: NameGarbageCollectorField,
  [ServiceType.Electricity]: NameElectricityField,
  [ServiceType.Maintenance]: NameMaintainceField,
  [ServiceType.WaterPart]: NameWaterPartField,
  [ServiceType.Inflicion]: NameInflicionField,
  [ServiceType.Discount]: NameDiscountField,
  [ServiceType.Placing]: NamePlacingField,
  [ServiceType.Water]: NameWaterField,
}

export default function NameComponent({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  
  const serviceId = Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { service } = useService({ serviceId, skip: edit })
  const { company } = useCompany({ companyId, skip: edit })

  if (record.name in fields) {
    const Component = fields[record.name]
    return (
      <Component
        dateMonth={getFormattedDate(
          paymentData?.monthService?.invoiceCreationDate ||
            paymentData?.invoiceCreationDate ||
            service?.date
        )}
        company={company}
        edit={edit}
      />
    )
  }

  return record.name
}
