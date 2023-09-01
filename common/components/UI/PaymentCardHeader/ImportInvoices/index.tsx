import { Button } from 'antd'
import { useState } from 'react'
import ImportInvoicesModal from './ImportInvoicesModal'

const ImportInvoices = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  return (
    <>
      <Button type="link" onClick={() => setIsModalOpen(true)}>
        Імпорт
      </Button>
      {isModalOpen && (
        <ImportInvoicesModal closeModal={() => setIsModalOpen(false)} />
      )}
    </>
  )
}

export default ImportInvoices
