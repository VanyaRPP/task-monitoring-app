import { EditFilled } from '@ant-design/icons'
import { EditDomainModal } from '@common/components/Modals/EditDomainModal'
import { IDomain } from '@common/modules/models/Domain'
import { IStreet } from '@common/modules/models/Street'
import { Button, ButtonProps } from 'antd'
import { useState } from 'react'

export interface EditDomainButtonProps extends Omit<ButtonProps, 'onClick'> {
  domain?: IDomain['_id']
  streets?: IStreet['_id'][]
  editable?: boolean
}

/**
 * Create/edit domain button with wrapped `EditDomainModal`
 *
 * @param domain - editing domain id (leave empty to create new domain)
 * @param streets - default street id's
 * @param editable - describes is form read-only or can be edited and is button enabled (default - `true`)
 * @param ...props - rest of `antd#Button` props except `onClick`
 */
export const EditDomainButton: React.FC<EditDomainButtonProps> = ({
  domain: domainId,
  streets: streetsIds,
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

      <EditDomainModal
        open={open}
        domain={domainId}
        streets={streetsIds}
        editable={editable}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
