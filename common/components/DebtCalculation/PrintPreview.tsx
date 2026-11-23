import { PrinterOutlined } from '@ant-design/icons'
import { Button, message, Modal } from 'antd'
import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import DebtDocumentTable from './DebtDocumentTable'
import { IDebtDocument, useDebtDocument } from './useDebtDocument'

interface Props {
  domainName?: string
  disabled?: boolean
}

// 13 columns: a landscape page holds them at a readable size.
const PAGE_STYLE = `
  @page {
    size: A4 landscape;
    margin: 8mm;
  }

  @media print {
    html,
    body {
      overflow: visible !important;
    }
  }
`

/**
 * «Друк» beside «Експорт в Excel»: the calculation opens as a preview first,
 * built from the same document as the Excel file, and is printed from there.
 * The print dialog also saves it as PDF.
 */
const PrintPreview: React.FC<Props> = ({ domainName, disabled }) => {
  const buildDocument = useDebtDocument(domainName)
  const [preview, setPreview] = useState<IDebtDocument | null>(null)
  const documentRef = useRef<HTMLDivElement>(null)

  const print = useReactToPrint({
    content: () => documentRef.current,
    pageStyle: PAGE_STYLE,
    // Becomes the file name when the dialog saves a PDF.
    documentTitle: preview?.fileName,
  })

  const open = (): void => {
    const built = buildDocument()
    if (!built) {
      message.warning('Немає що друкувати — оберіть компанію й період')
      return
    }
    setPreview(built)
  }

  return (
    <>
      <Button icon={<PrinterOutlined />} disabled={disabled} onClick={open}>
        Друк
      </Button>
      <Modal
        open={!!preview}
        title="Перегляд перед друком"
        width={1200}
        style={{ top: 20 }}
        onCancel={() => setPreview(null)}
        footer={[
          <Button key="close" onClick={() => setPreview(null)}>
            Закрити
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={print}
          >
            Друкувати / зберегти PDF
          </Button>,
        ]}
        destroyOnHidden
      >
        {preview && (
          <DebtDocumentTable ref={documentRef} document={preview.document} />
        )}
      </Modal>
    </>
  )
}

export default PrintPreview
