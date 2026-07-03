import { useRef } from 'react'
import { Typography } from 'antd'
import { InvoiceEditContext } from '@components/Forms/GroupedReceiptForm/InvoiceEditContext'
import { useReceiptTemplateProps } from '@components/Forms/GroupedReceiptForm/useReceiptTemplateProps'
import {
  templateMap,
  resolveBuiltinTemplateKey,
} from '@components/Forms/GroupedReceiptForm/templateMap'

const { Text } = Typography

type Snapshot = Record<string, any>

const InvoiceReceiptView: React.FC<{ snapshot?: Snapshot | null }> = ({
  snapshot,
}) => {
  const componentRef = useRef<HTMLDivElement | null>(null)
  const data = snapshot ?? null
  const templateProps = useReceiptTemplateProps({
    data,
    lang: data?.invoiceLang,
  })

  if (!data) return <Text type="secondary">Немає даних</Text>

  const Template = templateMap[resolveBuiltinTemplateKey(data)]

  return (
    <InvoiceEditContext.Provider
      value={{ editMode: false, lang: data.invoiceLang ?? 'uk' }}
    >
      <div style={{ overflow: 'auto' }}>
        <Template
          {...templateProps}
          componentRef={componentRef}
          invoiceLang={data.invoiceLang}
        />
      </div>
    </InvoiceEditContext.Provider>
  )
}

export default InvoiceReceiptView
