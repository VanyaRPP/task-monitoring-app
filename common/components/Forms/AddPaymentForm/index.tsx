import { validateField } from '@common/assets/features/validators'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import PaymentTypeSelect from '@common/components/UI/Reusable/PaymentTypeSelect'
import { Operations } from '@utils/constants'
import { Form, Input, InputNumber } from 'antd'
import CompanySelect from './CompanySelect'
import InvoiceCreationDate from './InvoiceCreationDate'
import InvoiceNumber from './InvoiceNumber'
import MonthServiceSelect from './MonthServiceSelect'
import PaymentPricesTable from './PaymentPricesTable'
import PaymentTotal from './PaymentTotal'
import s from './style.module.scss'

function AddPaymentForm({ paymentActions }) {
  const { preview, edit } = paymentActions

  const { form } = usePaymentContext()

  const serviceId = Form.useWatch('monthService', form)
  const companyId = Form.useWatch('company', form)
  const operation = Form.useWatch('operation', form)

  return (
    <>
      <DomainsSelect form={form} edit={edit} />
      <AddressesSelect form={form} edit={edit} />
      <MonthServiceSelect form={form} edit={edit} />
      <CompanySelect form={form} edit={edit} />
      <PaymentTypeSelect edit={!companyId || edit} />
      <InvoiceNumber form={form} paymentActions={paymentActions} />
      <InvoiceCreationDate edit={preview} />

      <Form.Item
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.operation !== currentValues.operation
        }
        className={s.priceItem}
      >
        {({ getFieldValue }) =>
          getFieldValue('operation') === Operations.Credit ? (
            <>
              <Form.Item
                name="generalSum"
                label="Сума"
                rules={validateField('paymentPrice')}
              >
                <InputNumber
                  placeholder="Вкажіть суму"
                  disabled={preview}
                  className={s.inputNumber}
                />
              </Form.Item>
              <Form.Item
                name="description"
                label="Опис"
                rules={validateField('required')}
              >
                <Input.TextArea
                  placeholder="Введіть опис"
                  maxLength={256}
                  disabled={preview}
                />
              </Form.Item>
            </>
          ) : (
            <>
              <PaymentPricesTable
                key={companyId + serviceId + operation}
                edit={!paymentActions.preview}
              />
              <PaymentTotal form={form} />
            </>
          )
        }
      </Form.Item>
    </>
  )
}

export default AddPaymentForm
