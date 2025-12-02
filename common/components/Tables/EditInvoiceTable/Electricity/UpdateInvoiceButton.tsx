import { Button, Space, Form, FormInstance, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons'
import { IService } from '@common/api/serviceApi/service.api.types'

interface UpdateInvoiceButtonProps {
  form: FormInstance;
  service?: IService;
  onClick?: () => void;
  disabled?: boolean;
}

export default function UpdateInvoiceButton({ form, service, onClick, disabled }: UpdateInvoiceButtonProps) {

  const handleUpdateClick = () => {
    try {
      const values = form.getFieldsValue();

      const updatedInvoice = values.invoice.map(item => {
        if (item.type === "electricityPrice") {
          return {
            ...item,
            losses: service?.losses || item.losses,
          };
        }
        return item;
      });

      form.setFieldsValue({
        invoice: updatedInvoice,
      });

      message.success('Рахунок оновлено успішно.');
    } catch (error) {
      message.error('Помилка оновлення рахунку.');
    }
  };

  return (
      <Button
        icon={<ReloadOutlined />}
        onClick={handleUpdateClick}
        disabled={disabled}
        size="small"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 28,
          width: 28,
          padding: 0,
          borderRadius: 4, 
        }}
      />
  );
}