import { EditDomainForm } from '@common/components/Forms/EditDomainForm'
import { EditModalProps } from '@common/components/Modals'
import { IDomain } from '@common/modules/models/Domain'
import { Form, Modal } from 'antd'
import { useCallback, useState } from 'react'

export interface EditDomainModalProps extends EditModalProps {
  domain?: IDomain['_id']
  streets?: IDomain['_id'][]
}

/**
 * Create/edit domain modal window with wrapped `EditDomainForm`
 *
 * @param domain - editing domain id (leave empty to create new domain)
 * @param streets - default street id's
 * @param editable - describes is form read-only or can be edited (default - `true`)
 * @param onOk - callback executed on successfull form submit
 * @param onCancel - callback executed on modal cancel
 * @param ...props - rest of `antd#Modal` props
 */
export const EditDomainModal: React.FC<EditDomainModalProps> = ({
  domain: domainId,
  streets: streetsIds,
  editable = true,
  onOk,
  onCancel,
  destroyOnClose = true,
  title,
  okButtonProps,
  cancelText,
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
    if (!changed || !domainId) {
      return handleOkSubmit()
    }

    Modal.confirm({
      title: 'Ви впевнені, що хочете зберегти?',
      content: 'Всі змінені дані будуть перезаписані',
      okText: 'Так',
      cancelText: 'Ні',
      onOk: handleOkSubmit,
    })
  }, [changed, domainId, handleOkSubmit])

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
          ? 'Перегляд надавача послуг'
          : domainId
          ? 'Редагування надавача послуг'
          : 'Створення надавача послуг'
      }
      okButtonProps={!editable ? { style: { display: 'none' } } : okButtonProps}
      cancelText={!editable ? 'Закрити' : cancelText}
      {...props}
    >
      <EditDomainForm
        form={form}
        domain={domainId}
        streets={streetsIds}
        editable={editable}
        onChange={handleChange}
        onFinish={handleFinish}
      />
    </Modal>
  )
}
