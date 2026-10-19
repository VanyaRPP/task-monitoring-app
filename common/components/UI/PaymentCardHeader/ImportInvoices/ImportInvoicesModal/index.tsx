import { useDraftInvoiceFromTextMutation } from '@common/api/paymentApi/payment.api'
import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import type { InvoiceTextDraft } from '@common/services/aiAssistant/invoiceFromText'
import { validateField } from '@assets/features/validators'
import { toPaymentFormData } from '@components/AIChat/invoiceDraft'
import AddPaymentModal from '@components/AddPaymentModal'
import CompanySelect from '@components/Forms/AddPaymentForm/CompanySelect'
import Modal from '@components/UI/ModalWindow'
import AddressesSelect from '@components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import PaymentTypeSelect from '@components/UI/Reusable/PaymentTypeSelect'
import { Operations } from '@utils/constants'
import { Form, Input, message } from 'antd'
import { useState } from 'react'

const INPUT_PLACEHOLDER = [
  'September: rent 5000, electricity 150 kWh at 4.32, garbage removal 200',
].join('\n')

interface ITextInvoiceDraft {
  paymentData: ReturnType<typeof toPaymentFormData<InvoiceTextDraft>>
  extraLines: IPaymentField[]
  lines?: IPaymentField[]
}

const ImportInvoicesModal = ({ closeModal }) => {
  const [form] = Form.useForm()
  const [isValueChanged, setIsValueChanged] = useState(false)
  const domainId = Form.useWatch('domain', form)
  const companyId = Form.useWatch('company', form)
  const [draftInvoiceFromText, { isLoading: isDrafting }] =
    useDraftInvoiceFromTextMutation()
  const [textDraft, setTextDraft] = useState<ITextInvoiceDraft | null>(null)

  const handleSave = async () => {
    const values = await form.validateFields().catch(() => null)
    if (!values) return

    if (!domainId || !companyId) {
      message.warning('Спершу оберіть надавача і компанію')
      return
    }

    try {
      const draft = await draftInvoiceFromText({
        text: values.input.trim(),
        companyId,
        domainId,
      }).unwrap()
      setTextDraft({
        paymentData: toPaymentFormData(draft),
        extraLines: draft.extraLines ?? [],
        lines:
          'replaceLines' in draft && draft.replaceLines
            ? draft.invoice
            : undefined,
      })
    } catch (error) {
      message.error(error?.data?.message || 'Не вдалося підготувати рахунок')
    }
  }

  return (
    <>
      <Modal
        title="Імпорт інвойсів"
        onOk={handleSave}
        confirmLoading={isDrafting}
        changed={() => isValueChanged}
        onCancel={closeModal}
        okText="Імпортувати"
        cancelText={'Закрити'}
      >
        <Form
          form={form}
          initialValues={{ operation: Operations.Debit }}
          onValuesChange={() => setIsValueChanged(true)}
        >
          <DomainsSelect form={form} />
          <AddressesSelect form={form} />
          <CompanySelect form={form} />
          <PaymentTypeSelect />
          <Form.Item
            name="input"
            label="Опис"
            rules={validateField('required')}
          >
            <Input.TextArea rows={14} placeholder={INPUT_PLACEHOLDER} />
          </Form.Item>
        </Form>
      </Modal>
      {textDraft && (
        <AddPaymentModal
          paymentData={textDraft.paymentData}
          invoiceLines={textDraft.lines}
          paymentActions={{ edit: false, preview: false }}
          closeModal={(success) => {
            setTextDraft(null)
            if (success) closeModal()
          }}
        />
      )}
    </>
  )
}

export default ImportInvoicesModal
