import { EditFilled } from '@ant-design/icons'
import { EditServiceModal } from '@common/components/Modals/EditServiceModal'
import { IDomain } from '@common/modules/models/Domain'
import { IService } from '@common/modules/models/Service'
import { IStreet } from '@common/modules/models/Street'
import { Button, ButtonProps } from 'antd'
import { useState } from 'react'

export interface EditServiceButtonProps extends Omit<ButtonProps, 'onClick'> {
  service?: IService['_id']
  domain?: IDomain['_id']
  street?: IStreet['_id']
  editable?: boolean
}

/**
 * Create/edit service button with wrapped `EditServiceModal`
 *
 * @param service - editing service id (leave empty to create new service)
 * @param domain - default domain id
 * @param street - default street id
 * @param editable - describes is form read-only or can be edited and is button enabled (default - `true`)
 * @param ...props - rest of `antd#Button` props except `onClick`
 */
export const EditServiceButton: React.FC<EditServiceButtonProps> = ({
  service: serviceId,
  domain: domainId,
  street: streetId,
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

      <EditServiceModal
        open={open}
        service={serviceId}
        domain={domainId}
        street={streetId}
        editable={editable}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
