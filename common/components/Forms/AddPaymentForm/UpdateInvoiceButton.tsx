import { Button, Space, Form, FormInstance, message } from 'antd';
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
    <Form.Item>
      <Space style={{ width: '100%', justifyContent: 'right' }} >
        <Button type="primary" onClick={handleUpdateClick} disabled={disabled}>
          Оновити рахунок
        </Button>
      </Space>
    </Form.Item>
  );
}