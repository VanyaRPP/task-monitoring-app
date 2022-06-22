import { Button, DatePicker, Form, Input, Select } from 'antd'
import type { RangePickerProps } from 'antd/es/date-picker'
import moment from 'moment'
import { useAddTaskMutation } from '../../../api/taskApi/task.api'
import s from './style.module.scss'

const AddTasks: React.FC = () => {

    const [addTask, { isLoading: isUpdating }] = useAddTaskMutation()

    const onSubmit = async (formData: any) => {
        await addTask(formData)
    }

    const validateMessages = {
        required: '${label} is required!',
    }

    const disabledDate: RangePickerProps['disabledDate'] = current => {
        return current && current < moment().startOf('day')
    }

    return (
        <>
            <h2 className={s.Header}>Add new task</h2>
            <Form
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 8 }}
                layout="horizontal"
                onFinish={onSubmit}
                validateMessages={validateMessages}
            >
                <Form.Item name='name' label="Name of task" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name='description' label="Description">
                    <Input.TextArea />
                </Form.Item>
                <Form.Item name='domain' label="Domain">
                    <Select>
                        <Select.Option value="domain 1">Domain 1</Select.Option>
                        <Select.Option value="domain 2">Domain 2</Select.Option>
                        <Select.Option value="domain 3">Domain 3</Select.Option>
                        <Select.Option value="domain 4">Domain 4</Select.Option>
                        <Select.Option value="domain 5">Domain 5</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name='category' label="Categories">
                    <Select>
                        <Select.Option value="category 1">Category 1</Select.Option>
                        <Select.Option value="category 2">Category 2</Select.Option>
                        <Select.Option value="category 3">Category 3</Select.Option>
                        <Select.Option value="category 4">Category 4</Select.Option>
                        <Select.Option value="category 5">Category 5</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name='deadline' label="Deadline" rules={[{ required: true }]}>
                    <DatePicker disabledDate={disabledDate} />
                </Form.Item>
                <Form.Item wrapperCol={{ span: 8, offset: 8 }}>
                    <Button htmlType="submit">Create task</Button>
                </Form.Item>
            </Form>
        </>
    )
}

export default AddTasks









