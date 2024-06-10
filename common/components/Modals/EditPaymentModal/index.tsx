import { EditPaymentForm } from '@common/components/Forms/EditPaymentForm'
import { EditModalProps } from '@common/components/Modals'
import { IDomain } from '@common/modules/models/Domain'
import { IPayment } from '@common/modules/models/Payment'
import { IRealEstate } from '@common/modules/models/RealEstate'
import { IService } from '@common/modules/models/Service'
import { IStreet } from '@common/modules/models/Street'
import { Form, Modal } from 'antd'
import { useCallback, useState } from 'react'

export interface EditPaymentModalProps extends EditModalProps {
  payment?: IPayment['_id']
  domain?: IDomain['_id']
  street?: IStreet['_id']
  company?: IRealEstate['_id']
  service?: IService['_id']
}

/**
 * Create/edit payment modal window with wrapped `EditPaymentForm`
 *
 * @param payment - editing payment id (leave empty to create new payment)
 * @param domain - default domain id
 * @param street - default street id
 * @param company - default company id
 * @param service - default service id
 * @param editable - describes is form read-only or can be edited (default - `true`)
 * @param onOk - callback executed on successfull form submit
 * @param onCancel - callback executed on modal cancel
 * @param ...props - rest of `antd#Modal` props
 */
export const EditPaymentModal: React.FC<EditPaymentModalProps> = ({
  payment: paymentId,
  domain: domainId,
  street: streetId,
  company: companyId,
  service: serviceId,
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
    if (!changed || !paymentId) {
      return handleOkSubmit()
    }

    Modal.confirm({
      title: 'Ви впевнені, що хочете зберегти?',
      content: 'Всі змінені дані будуть перезаписані',
      okText: 'Так',
      cancelText: 'Ні',
      onOk: handleOkSubmit,
    })
  }, [changed, paymentId, handleOkSubmit])

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
          ? 'Перегляд проплати'
          : paymentId
          ? 'Редагування проплати'
          : 'Створення проплати'
      }
      okButtonProps={!editable ? { style: { display: 'none' } } : okButtonProps}
      cancelText={!editable ? 'Закрити' : cancelText}
      {...props}
    >
      <EditPaymentForm
        form={form}
        payment={paymentId}
        domain={domainId}
        street={streetId}
        company={companyId}
        service={serviceId}
        editable={editable}
        onChange={handleChange}
        onFinish={handleFinish}
      />
    </Modal>
  )
}
