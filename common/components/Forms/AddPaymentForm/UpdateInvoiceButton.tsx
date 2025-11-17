import { Button, Space, Form } from 'antd';

interface UpdateInvoiceButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function UpdateInvoiceButton({ onClick, disabled }: UpdateInvoiceButtonProps) {
  return (
    <Form.Item>
      <Space style={{ width: '100%', justifyContent: 'right' }} >
        <Button type="primary" onClick={onClick} disabled={disabled}>
          Оновити рахунок
        </Button>
      </Space>
    </Form.Item>
  );
}