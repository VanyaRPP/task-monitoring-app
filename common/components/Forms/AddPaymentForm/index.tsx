import React, {useMemo, useState} from 'react'
import { validateField } from '@common/assets/features/validators'
import {Button, Form, Input, InputNumber, message, Upload} from 'antd'
import s from './style.module.scss'
import { Operations, ServiceType } from '@utils/constants'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import CompanySelect from './CompanySelect'
import PaymentTotal from './PaymentTotal'
import PaymentPricesTable from './PaymentPricesTable'
import MonthServiceSelect from './MonthServiceSelect'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import moment from 'moment'
import InvoiceNumber from './InvoiceNumber'
import InvoiceCreationDate from './InvoiceCreationDate'
import { convertToInvoicesObject } from '@utils/helpers'
import PaymentTypeSelect from '@common/components/UI/Reusable/PaymentTypeSelect'
import {UploadFile} from "antd/es/upload/interface";

function AddPaymentForm({ paymentActions }) {
  const { form, paymentData } = usePaymentContext()
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const initialValues = useMemo(() => {
    return getInitialValues(paymentData)
  }, [paymentData])

  const serviceId = Form.useWatch('monthService', form)
  const companyId = Form.useWatch('company', form)
  const operation = Form.useWatch('operation', form)
  const { preview, edit } = paymentActions

  const handleFileUpload = (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
      setFileList([info.file])

      console.log('info.file', [info.file])

    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  }

  return (
    <Form
      initialValues={initialValues}
      form={form}
      layout="vertical"
      className={s.Form}
    >
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
                paymentActions={paymentActions}
              />
              <PaymentTotal form={form} />
            </>
          )
        }
      </Form.Item>
        <Form.Item
            name="photoURL"
            label="Фото"
            valuePropName="fileList"
            getValueFromEvent={(e) => e.fileList}
        >
            <Upload
                name="photoURL"
                listType="picture-card"
                fileList={fileList}
                onChange={handleFileUpload}
                beforeUpload={() => false}
                maxCount={1}
                showUploadList={{
                    showRemoveIcon: true,
                    }
                }
            >
              {fileList.length < 1 && '+ Завантажити'}
            </Upload>
        </Form.Item>
    </Form>
  )
}

function getInitialValues(paymentData) {

  const custom = paymentData?.invoice.filter(
      (item) => item?.type === ServiceType.Custom
    )

  const customFields = custom?.reduce((acc, item) => {
    acc[item.name] = { price: item.price }
    return acc
  }, {})

  const initialValues = {
    domain: paymentData?.domain?._id,
    street: paymentData?.street?._id,
    monthService: paymentData?.monthService?._id,
    company: paymentData?.company?._id,
    description: paymentData?.description,
    credit: paymentData?.credit,
    generalSum: paymentData?.generalSum,
    debit: paymentData?.debit,
    invoiceNumber: paymentData?.invoiceNumber,
    photoURL: paymentData?.photoURL,
    invoiceCreationDate: moment(paymentData?.invoiceCreationDate),
    operation: paymentData ? paymentData.type : Operations.Credit,
    ...convertToInvoicesObject(paymentData?.invoice || []),
    ...customFields,
  }

  return initialValues
}
export default AddPaymentForm
