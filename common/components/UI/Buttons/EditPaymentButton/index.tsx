import { EditFilled } from '@ant-design/icons'
import { EditPaymentModal } from '@common/components/Modals/EditPaymentModal'
import { IDomain } from '@common/modules/models/Domain'
import { IPayment } from '@common/modules/models/Payment'
import { IRealEstate } from '@common/modules/models/RealEstate'
import { IService } from '@common/modules/models/Service'
import { IStreet } from '@common/modules/models/Street'
import { Button, ButtonProps } from 'antd'
import { useState } from 'react'

export interface EditPaymentButtonProps extends Omit<ButtonProps, 'onClick'> {
  payment?: IPayment['_id']
  domain?: IDomain['_id']
  street?: IStreet['_id']
  company?: IRealEstate['_id']
  service?: IService['_id']
  editable?: boolean
}

/**
 * Create/edit payment button with wrapped `EditPaymentModal`
 *
 * @param payment - editing payment id (leave empty to create new payment)
 * @param domain - default domain id
 * @param street - default street id
 * @param company - default company id
 * @param service - default service id
 * @param editable - describes is form read-only or can be edited and is button enabled (default - `true`)
 * @param ...props - rest of `antd#Button` props except `onClick`
 */
export const EditPaymentButton: React.FC<EditPaymentButtonProps> = ({
  payment: paymentId,
  domain: domainId,
  street: streetId,
  company: companyId,
  service: serviceId,
  editable = true,
  children = <EditFilled />,
  ...props
}) => {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <>
      <Button type="dashed" onClick={() => setOpen(true)} {...props}>
        {children}
      </Button>

      <EditPaymentModal
        open={open}
        payment={paymentId}
        domain={domainId}
        street={streetId}
        company={companyId}
        service={serviceId}
        editable={editable}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
