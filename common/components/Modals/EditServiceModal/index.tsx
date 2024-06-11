import { EditServiceForm } from '@common/components/Forms/EditServiceForm'
import { EditModalProps } from '@common/components/Modals'
import { IDomain } from '@common/modules/models/Domain'
import { IService } from '@common/modules/models/Service'
import { IStreet } from '@common/modules/models/Street'
import { Form, Modal } from 'antd'
import { useCallback, useState } from 'react'

export interface EditServiceModalProps extends EditModalProps {
  service?: IService['_id']
  domain?: IDomain['_id']
  street?: IStreet['_id']
}

/**
 * Create/edit service modal window with wrapped `EditServiceForm`
 *
 * @param service - editing service id (leave empty to create new service)
 * @param domain - default domain id
 * @param street - default street id
 * @param editable - describes is form read-only or can be edited (default - `true`)
 * @param onOk - callback executed on successfull form submit
 * @param onCancel - callback executed on modal cancel
 * @param ...props - rest of `antd#Modal` props
 */
export const EditServiceModal: React.FC<EditServiceModalProps> = ({
  service: serviceId,
  domain: domainId,
  street: streetId,
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
    if (!changed || !serviceId) {
      return handleOkSubmit()
    }

    Modal.confirm({
      title: 'Ви впевнені, що хочете зберегти?',
      content: 'Всі змінені дані будуть перезаписані',
      okText: 'Так',
      cancelText: 'Ні',
      onOk: handleOkSubmit,
    })
  }, [changed, serviceId, handleOkSubmit])

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
          ? 'Перегляд послуги'
          : serviceId
          ? 'Редагування послуги'
          : 'Створення послуги'
      }
      okButtonProps={!editable ? { style: { display: 'none' } } : okButtonProps}
      cancelText={!editable ? 'Закрити' : cancelText}
      {...props}
    >
      <EditServiceForm
        form={form}
        service={serviceId}
        domain={domainId}
        street={streetId}
        editable={editable}
        onChange={handleChange}
        onFinish={handleFinish}
      />
    </Modal>
  )
}
