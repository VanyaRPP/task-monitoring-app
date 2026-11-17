import { getCurrencyShortLabel } from '@utils/helpers'
import { Form, FormInstance, Typography } from 'antd'
import dayjs from 'dayjs'

interface Props {
  form: FormInstance
}

/**
 * Header of the collapsed "details" block of the invoice form: shows what the
 * fields inside currently hold, so their defaults are visible without opening
 * the block.
 */
const DetailsSummary: React.FC<Props> = ({ form }) => {
  const invoiceNumber = Form.useWatch('invoiceNumber', form)
  const invoiceCreationDate = Form.useWatch('invoiceCreationDate', form)
  const currency = Form.useWatch('currency', form)

  const date = invoiceCreationDate ? dayjs(invoiceCreationDate) : null
  const parts = [
    invoiceNumber ? `№ ${invoiceNumber}` : null,
    date?.isValid() ? date.format('DD.MM.YYYY') : null,
    currency ? getCurrencyShortLabel(currency) : null,
  ].filter(Boolean)

  return (
    <span>
      Адреса, номер, дата, валюта
      {parts.length > 0 && (
        <Typography.Text type="secondary">
          {' '}
          · {parts.join(' · ')}
        </Typography.Text>
      )}
    </span>
  )
}

export default DetailsSummary
