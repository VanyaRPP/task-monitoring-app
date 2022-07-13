import { PlusOutlined } from '@ant-design/icons'
import {
  Tabs,
  Button,
  Col,
  Row,
  Statistic,
  Input,
  Comment,
  Avatar,
  Tooltip,
  Form,
} from 'antd'
import moment from 'moment'
import { useState } from 'react'
import { useAddCategoryMutation } from '../../api/categoriesApi/category.api'
import { useGetAllUsersQuery } from '../../api/userApi/user.api'
import AddCategoryForm from '../../components/AddCategoryForm'
import Categories from '../../components/Categories'
import ModalWindow from '../../components/UI/ModalWindow'
import { ICategory } from '../../models/Category'
import s from './style.module.scss'

const AdminPage: React.FC = () => {
  const { TabPane } = Tabs
  const { Search } = Input
  const [form] = Form.useForm()

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)

  const [addCategory] = useAddCategoryMutation()

  const onCancelModal = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const onSubmiModal = async () => {
    const formData: ICategory = await form.validateFields()
    setIsFormDisabled(true)
    await addCategory({ ...formData })
    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }

  return (
    <>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Categories" key="1">
          <div className={s.Controls}>
            <Search
              className={s.Search}
              placeholder="input search text"
              onSearch={() => console.log('search')}
              enterButton
            />
            <Button
              className={s.AddButton}
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            />
            <ModalWindow
              isModalVisible={isModalVisible}
              onCancel={onCancelModal}
              onOk={onSubmiModal}
              okText="Create category"
              cancelText="Cancel"
            >
              <AddCategoryForm isFormDisabled={isFormDisabled} form={form} />
            </ModalWindow>
          </div>
          <Categories />
        </TabPane>

        <TabPane tab="Clients" key="2">
          <Tabs type="card">
            <TabPane tab="Users" key="1">
              <Tabs type="card" tabPosition="left">
                User
              </Tabs>
            </TabPane>
            <TabPane tab="Worker" key="2">
              Worker
            </TabPane>
            <TabPane tab="Premium" key="3">
              Premium
            </TabPane>
          </Tabs>
        </TabPane>

        <TabPane tab="Сomplaints" key="3">
          <Comment
            author={<a>Han Solo</a>}
            avatar={
              <Avatar src="https://joeschmoe.io/api/v1/random" alt="Han Solo" />
            }
            content={
              <p>
                Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                Voluptatem similique animi aspernatur illo quasi ullam odit.
                Consequuntur quae at assumenda?
              </p>
            }
            datetime={
              <Tooltip title={moment().format('YYYY-MM-DD HH:mm:ss')}>
                <span>{moment().fromNow()}</span>
              </Tooltip>
            }
          />
        </TabPane>
      </Tabs>
    </>
  )
}

export default AdminPage
