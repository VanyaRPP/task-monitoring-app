import React from 'react';
import { Modal, Form } from 'antd';
import { EditUserForm } from '../Forms/EditUserForm';

interface EditUserModalProps {
  open: boolean;
  userId?: string;
  onOk: () => void;
  onCancel: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ open, userId, onOk, onCancel }) => {
  const [form] = Form.useForm();
  return (
    <Modal
      open={open}
      title="Редагування профілю"
      onCancel={onCancel}
      onOk={form.submit}
    >
      <EditUserForm userId={userId} onFinish={onOk} form={form}/>
    </Modal>
  );
};
