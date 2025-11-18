import { Button, Space, Form, FormInstance, message } from 'antd';

interface UpdateInvoiceButtonProps {
  form: FormInstance;
  onClick?: () => void;
  disabled?: boolean;
}

export default function UpdateInvoiceButton({ form, onClick, disabled }: UpdateInvoiceButtonProps) {

  const handleUpdateClick = () => {
    try {
      const values = form.getFieldsValue();

      const updatedInvoice = values.invoice.map(item => {
        if (item.type === "electricityPrice") {
          return {
            ...item,
            losses: 777,
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