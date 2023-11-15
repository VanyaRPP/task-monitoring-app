import React from 'react'
import { Form, Input, InputNumber } from 'antd'
import {
  deleteExtraWhitespace,
  allowOnlyNumbers,
  validateField,
} from '@common/assets/features/validators'

const TestForm: React.FC = () => {
  const [form] = Form.useForm()
    return(
        <Form
        id="addTaskForm"
        style={{ position: 'relative' }}
        form={form}
        layout="vertical"
        name="form_in_modal"
      >
        <Form.Item
            name="name"
            label="name"
            normalize={deleteExtraWhitespace}
            rules={validateField('name')}
          >
            <Input id="form_in_modal_name"/>
          </Form.Item>
        <Form.Item 
        name="email" 
        label="email"
        rules={validateField('email')}>
          <Input placeholder="Електронна пошта" id="form_in_modal_email"/>
        </Form.Item>
      <Form.Item
        name="description"
        label="description"
        normalize={deleteExtraWhitespace}
        rules={validateField('description')}
      >
        <Input.TextArea id="form_in_modal_description"/>
      </Form.Item>
      <Form.Item 
        name="phone" 
        label="phone"
        rules={validateField('phone')}>
          <Input placeholder="Телефон" id="form_in_modal_phone"/>
        </Form.Item>
        <Form.Item
        normalize={allowOnlyNumbers}
        name="price"
        label="price"
        rules={validateField('price')}
      >
        <Input addonAfter="₴" style={{ width: '100%' }} id="form_in_modal_price"/>
      </Form.Item>
      <Form.Item
            name="password"
            required
            labelCol={{ span: 24 }}
            label="password"
            rules={validateField('password')}
            normalize={(v) => v.trim()}
          >
            <Input id="form_in_modal_password"/>
          </Form.Item>
          <Form.Item
                name="paymentPrice"
                label="paymentPrice"
                rules={validateField('paymentPrice')}
              >
                <InputNumber
                  placeholder="Вкажіть суму"
                  id="form_in_modal_paymentPrice"
                />
              </Form.Item>
              <Form.Item
        name="electricityPrice"
        label="electricityPrice"
        rules={validateField('electricityPrice')}
      >
        <InputNumber 
        placeholder="Вкажіть значення"
        id="form_in_modal_electricityPrice"/>
        
      </Form.Item>
    </Form>
      )
    };

    export default TestForm;