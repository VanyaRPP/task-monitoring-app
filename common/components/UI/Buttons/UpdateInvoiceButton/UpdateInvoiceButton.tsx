import { Button, FormInstance, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons'
import { IService } from '@common/api/serviceApi/service.api.types'

export type InvoiceType = 'waterPrice' | 'waterPart' | 'garbageCollector' | 'electricityPrice' | 'placing' | 'infliction';

interface UpdateInvoiceButtonProps {
  form?: FormInstance;
  service?: IService;
  invoiceType?: InvoiceType;
  onClick?: () => void;
  disabled?: boolean;
}

export default function UpdateInvoiceButton({ 
  form, 
  service, 
  invoiceType,
  onClick, 
  disabled 
}: UpdateInvoiceButtonProps) {
  return (
    <Button
      icon={<ReloadOutlined />}
      onClick={onClick}
      disabled={disabled}
      size="small"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 28,
        width: 28,
        minWidth: 28,
        padding: 0,
        borderRadius: 4,
      }}
    />
  )
}
