import { EditStreetForm } from '@common/components/Forms/EditStreetForm'
import { EditModalProps } from '@common/components/Modals'
import { IStreet } from '@common/modules/models/Street'
import { Form, Modal } from 'antd'
import { useCallback, useState } from 'react'

export interface EditStreetModalProps extends EditModalProps {
  street?: IStreet['_id']
}

/**
 * Create/edit street modal window with wrapped `EditStreetForm`
 *
 * @param street - editing street id (leave empty to create new street)
 * @param editable - describes is form read-only or can be edited (default - `true`)
 * @param onOk - callback executed on successfull form submit
 * @param onCancel - callback executed on modal cancel
 * @param ...props - rest of `antd#Modal` props
 */
export const EditStreetModal: React.FC<EditStreetModalProps> = ({
  street: streetId,
  editable = true,
  onOk,
  onCancel,
  destroyOnClose = true,
  title,
  ...props
}) => {
  const [form] = Form.useForm()
  const [changed, setChanged] = useState<boolean>(false)

  const handleOkSubmit = useCallback(() => {
    form.submit()
  }, [form])

  const handleCancelSubmit = useCallback(() => {
    if (onCancel) onCancel()
    setChanged(false)
    form.resetFields()
  }, [form, onCancel])

  const handleOk = useCallback(() => {
    if (!changed || !streetId) {
      return handleOkSubmit()
    }

    Modal.confirm({
      title: 'Ви впевнені, що хочете зберегти?',
      content: 'Всі змінені дані будуть перезаписані',
      okText: 'Так',
      cancelText: 'Ні',
      onOk: handleOkSubmit,
    })
  }, [changed, streetId, handleOkSubmit])

  const handleCancel = useCallback(() => {
    if (!changed) {
      return handleCancelSubmit()
    }

    Modal.confirm({
      title: 'Ви впевнені, що хочете вийти?',
      content: 'Всі незбережені дані будуть втрачені',
      okText: 'Так',
      cancelText: 'Ні',
      onOk: handleCancelSubmit,
    })
  }, [changed, handleCancelSubmit])

  const handleFinish = useCallback(() => {
    setChanged(false)
    if (onOk) onOk()
  }, [onOk])

  const handleChange = useCallback(() => {
    setChanged(true)
  }, [])

  return (
    <Modal
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnClose={destroyOnClose}
      title={
        title
          ? title
          : !editable
          ? 'Перегляд адреси'
          : streetId
          ? 'Редагування адреси'
          : 'Додавання адреси'
      }
      {...props}
    >
      <EditStreetForm
        form={form}
        street={streetId}
        editable={editable}
        onChange={handleChange}
        onFinish={handleFinish}
      />
    </Modal>
  )
}
