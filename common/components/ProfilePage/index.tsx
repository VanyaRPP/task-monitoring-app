import React, { useEffect, useState } from 'react'
import { Radio } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Image, Input } from 'antd'
import RoleSwitcher from 'common/components/UI/roleSwitcher'
import Router, { useRouter } from 'next/router'
import s from './style.module.scss'
import {
  useGetCurrentUserQuery,
  useUpdateUserMutation,
} from '../../api/userApi/user.api'
import { AppRoutes, Roles } from '../../../utils/constants'
import { IProfileData } from './index.types'
import UnsavedChangesModal from '../UI/UnsavedChangesModal'
import useLocalStorage from '@common/modules/hooks/useLocalStorage'
import useGoogleQueries from '@common/modules/hooks/useGoogleQueries'
import { getFormattedAddress } from '@utils/helpers'
import MyDomain from './my-domain'

const ProfilePage: React.FC = () => {
  const [storedData, setValue] = useLocalStorage('profile-data', null)
  const { getGeoCode, address } = useGoogleQueries()
  const router = useRouter()
  const [profileData, setProfileData] = useState<IProfileData>()
  const [editing, setEditing] = useState<boolean>(false)
  const [updateUser] = useUpdateUserMutation()
  const { data: userData, isLoading } = useGetCurrentUserQuery()
  const user = userData

  const handleChange = (value: any) => {
    if (value.name === 'address') {
      const address = { ...profileData.address, name: value.value }
      setProfileData({ ...profileData, [value.name]: address })
    }
    setProfileData({ ...profileData, [value.name]: value.value })
    setEditing(true)
  }

  const handleSubmit = async () => {
    if (profileData.address.name) {
      await getGeoCode(profileData.address.name)
      profileData.address = address
    }
    updateUser({ _id: user?._id, ...profileData })
    setEditing(false)
  }

  const handleCancel = () => {
    setEditing(false)
    setProfileData(storedData)
  }

  useEffect(() => {
    const profileData = {
      email: user?.email,
      tel: user?.tel,
      address: user?.address,
    }
    setProfileData(profileData)
    setValue(profileData)
  }, [user?.address, user?.email, user?.tel])

  return (
    <>
      <h2 className={s.Header}>Мій Профіль</h2>
      <div className={s.Container}>
        <Card
          loading={isLoading}
          title={user?.name}
          className={s.Profile}
          extra={
            user?.roles?.includes(Roles.GLOBAL_ADMIN) && (
              <Button
                type="link"
                onClick={() => Router.push(AppRoutes.ADMIN)}
                className={s.Admin}
              >
                Панель Адміністратора
              </Button>
            )
          }
        >
          <div className={s.Avatar}>
            <Avatar
              icon={<UserOutlined />}
              src={<Image src={user?.image || undefined} alt="User" />}
            />
          </div>
          <div className={s.Info}>
            <Card size="small" title="Роль">
              {router.query.id ? user?.roles[0] : <RoleSwitcher />}
            </Card>
            <Card size="small" title="Електронна пошта" className={s.Edit}>
              <Input
                name="email"
                onChange={(event) => handleChange(event.target)}
                value={profileData?.email}
              />
            </Card>
            <Card size="small" title="Номер телефону" className={s.Edit}>
              <Input
                name="tel"
                onChange={(event) => handleChange(event.target)}
                value={profileData?.tel}
                placeholder="Введіть номер телефону"
              />
            </Card>
            <Card title="Адреса" size="small" className={s.Edit}>
              <Input
                name="address"
                onChange={(event) => handleChange(event.target)}
                value={getFormattedAddress(profileData?.address?.name)}
                placeholder="Введіть адресу"
              />
            </Card>
            <MyDomain />
          </div>
        </Card>
        {/* <FeedbacksCard user={user} loading={isLoading} userRate={userRate} /> */}
      </div>
      {editing && (
        <UnsavedChangesModal onCancel={handleCancel} onSubmit={handleSubmit} />
      )}
    </>
  )
}

export default ProfilePage
