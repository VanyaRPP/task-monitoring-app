import { ModalProps } from 'antd'

export interface EditModalProps extends Omit<ModalProps, 'onOk' | 'onCancel'> {
  onOk?: () => void
  onCancel?: () => void
  editable?: boolean
}
