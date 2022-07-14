import { PlusOutlined } from '@ant-design/icons'
import { Tabs, Button, Input, Comment, Avatar, Tooltip, Form } from 'antd'
import moment from 'moment'
import { unstable_getServerSession } from 'next-auth'
import { useState } from 'react'
import { useAddCategoryMutation } from '../../api/categoriesApi/category.api'
import AddCategoryForm from '../../components/AddCategoryForm'
import AdminPageCategories from '../../components/AdminIU/AdminPageCategorie'
import AdminPageClients from '../../components/AdminIU/AdminPageClients'
import Categories from '../../components/Categories'
import ModalWindow from '../../components/UI/ModalWindow'
import { ICategory } from '../../models/Category'
import { authOptions } from '../api/auth/[...nextauth]'
import s from './style.module.scss'

const AdminPage: React.FC = () => {
  const { TabPane } = Tabs

  return (
    <>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Categories" key="1">
          <AdminPageCategories />
        </TabPane>
        <TabPane tab="Clients" key="2">
          <AdminPageClients />
        </TabPane>
        <TabPane tab="Domains" key="3">
          Domains
        </TabPane>
      </Tabs>
    </>
  )
}

export default AdminPage

export async function getServerSideProps(context) {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

  const response = await fetch(
    `http://localhost:3000/api/user/${session?.user?.email}`
  )
  const data = await response.json()
  const role = data?.data?.role

  if (role !== 'Worker') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
