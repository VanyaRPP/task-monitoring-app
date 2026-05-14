import { FC, ReactElement } from 'react'
import { Dropdown, MenuProps } from 'antd'
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons'

export interface PrintDownloadMenuProps {
  onPrint: () => void
  onDownload: () => void
  printLabel: string
  downloadLabel: string
  loading?: boolean
  trigger?: ReactElement
}

const PrintDownloadMenu: FC<PrintDownloadMenuProps> = ({
  onPrint,
  onDownload,
  printLabel,
  downloadLabel,
  loading = false,
  trigger,
}) => {
  const items: MenuProps['items'] = [
    {
      key: 'print',
      label: printLabel,
      icon: <PrinterOutlined />,
      onClick: onPrint,
    },
    {
      key: 'download',
      label: downloadLabel,
      icon: <DownloadOutlined />,
      onClick: onDownload,
      disabled: loading,
    },
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      {trigger ?? (
        <PrinterOutlined
          style={loading ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
        />
      )}
    </Dropdown>
  )
}

export default PrintDownloadMenu
