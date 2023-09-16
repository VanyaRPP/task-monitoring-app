import { ServiceType, paymentsTitle } from '@utils/constants'
import {
  NameDiscountField,
  NameElectricityField,
  NameGarbageCollectorField,
  NameInflicionField,
  NameMaintainceField,
  NamePlacingField,
  NameWaterField,
  NameWaterPartField,
} from './nameFields'
import useService from '@common/modules/hooks/useService'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Form } from 'antd'
import { getDispalyedDate } from '@common/components/Forms/ReceiptForm'
import { getName } from '@utils/helpers'
import useCompany from '@common/modules/hooks/useCompany'

const fields: any = {
  [ServiceType.Maintenance]: NameMaintainceField,
  [ServiceType.Placing]: NamePlacingField,
  [ServiceType.Electricity]: NameElectricityField,
  [ServiceType.Water]: NameWaterField,
  [ServiceType.GarbageCollector]: NameGarbageCollectorField,
  [ServiceType.Inflicion]: NameInflicionField,
  [ServiceType.WaterPart]: NameWaterPartField,
  [ServiceType.Discount]: NameDiscountField,
}

export default function NameComponent({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const serviceId = Form.useWatch('service', form) || paymentData?.monthService
  const { service } = useService({ serviceId, skip: edit })
  const nameRes = getName(record.name, paymentsTitle)
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: edit })

  if (record.name in fields) {
    const dateMonth = getDispalyedDate(paymentData, service?.date, record.name)
    const Component = fields[record.name]
    return (
      <Component
        nameRes={nameRes || record.name}
        dateMonth={dateMonth}
        company={company}
        edit={edit}
      />
    )
  }

  return record.name
}

//         return (
//           <>
//                 {!!company?.servicePricePerMeter &&
//                   nameRes === paymentsTitle.maintenancePrice && (
//                     <span className={s.month}> індивідуальне</span>
//                   )}
//           </>
//         )
