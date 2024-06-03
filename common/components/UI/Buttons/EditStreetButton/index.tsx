import { EditFilled } from '@ant-design/icons'
import { EditStreetModal } from '@common/components/Modals/EditStreetModal'
import { IStreet } from '@common/modules/models/Street'
import { Button, ButtonProps } from 'antd'
import { useState } from 'react'

export interface EditStreetButtonProps extends Omit<ButtonProps, 'onClick'> {
  street?: IStreet['_id']
  editable?: boolean
}

/**
 * Create/edit street button with wrapped `EditStreetModal`
 *
 * @param street - editing street id (leave empty to create new street)
 * @param editable - describes is form read-only or can be edited and is button enabled (default - `true`)
 * @param ...props - rest of `antd#Button` props except `onClick`
 */
export const EditStreetButton: React.FC<EditStreetButtonProps> = ({
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

      <EditStreetModal
        open={open}
        street={streetId}
        editable={editable}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
