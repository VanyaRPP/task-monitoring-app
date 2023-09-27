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
  NameCleaningField,
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
  [ServiceType.Cleaning]: NameCleaningField,
}

export default function NameComponent({ record, preview }) {
  const { paymentData, form } = usePaymentContext()
  const serviceId = Form.useWatch('monthService', form)
  const companyId = Form.useWatch('company', form)

  const { service } = useService({ serviceId, skip: preview })
  const { company } = useCompany({ companyId, skip: preview })

  if (record.name in fields) {
    const Component = fields[record.name]
    return (
      <Component
        dateMonth={getFormattedDate(
          paymentData?.monthService?.date ||
            paymentData?.invoiceCreationDate ||
            service?.date
        )}
        service={service || paymentData?.monthService}
        company={company || paymentData?.company}
        domain={paymentData?.domain}
        street={paymentData?.street}
        
        preview={preview}
      />
    )
  }

  return record.name
}
