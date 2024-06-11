import { EditCompanyForm } from '@common/components/Forms/EditCompanyForm'
import { EditModalProps } from '@common/components/Modals'
import { IDomain } from '@common/modules/models/Domain'
import { IRealEstate } from '@common/modules/models/RealEstate'
import { IStreet } from '@common/modules/models/Street'
import { Form, Modal } from 'antd'
import { useCallback, useState } from 'react'

export interface EditCompanyModalProps extends EditModalProps {
  company?: IRealEstate['_id']
  street?: IStreet['_id']
  domain?: IDomain['_id']
}

/**
 * Create/edit company modal window with wrapped `EditCompanyForm`
 *
 * @param company - editing company id (leave empty to create new company)
 * @param street - default street id
 * @param domain - default domain id
 * @param editable - describes is form read-only or can be edited (default - `true`)
 * @param onOk - callback executed on successfull form submit
 * @param onCancel - callback executed on modal cancel
 * @param ...props - rest of `antd#Modal` props
 */
export const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  company: companyId,
  street: streetId,
  domain: domainId,
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
    if (!changed || !companyId) {
      return handleOkSubmit()
    }

    Modal.confirm({
      title: 'Ви впевнені, що хочете зберегти?',
      content: 'Всі змінені дані будуть перезаписані',
      okText: 'Так',
      cancelText: 'Ні',
      onOk: handleOkSubmit,
    })
  }, [changed, companyId, handleOkSubmit])

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
          ? 'Перегляд компанії'
          : streetId
          ? 'Редагування компанії'
          : 'Створення компанії'
      }
      okButtonProps={!editable ? { style: { display: 'none' } } : okButtonProps}
      cancelText={!editable ? 'Закрити' : cancelText}
      {...props}
    >
      <EditCompanyForm
        form={form}
        company={companyId}
        street={streetId}
        domain={domainId}
        editable={editable}
        onChange={handleChange}
        onFinish={handleFinish}
      />
    </Modal>
  )
}
