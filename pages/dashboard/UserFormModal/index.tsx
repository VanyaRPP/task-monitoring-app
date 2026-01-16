import { useMemo } from 'react'
import { Modal, Space, Typography, Empty, Spin, List, Divider } from 'antd'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import type { IUser } from '@common/api/userApi/user.api.types'

const { Text } = Typography

export interface UserInfoModalProps {
  visible: boolean
  onClose: () => void
  user: IUser | null
}

const UserFormModal: React.FC<UserInfoModalProps> = ({
  visible,
  onClose,
  user,
}) => {
  const { data: domains = [], isLoading: domainsLoading } =
    useGetDomainsQuery({ limit: 1000 }, { skip: !visible })

  const { data: realEstates, isLoading: realEstatesLoading } =
    useGetAllRealEstateQuery({ archived: false }, { skip: !visible })

  const userEmail = user?.email?.toLowerCase()

  const userDomains = useMemo(() => {
    if (!userEmail) return []
    return domains.filter((d: any) =>
      d.adminEmails?.some((e: string) => e.toLowerCase() === userEmail)
    )
  }, [domains, userEmail])

  const userCompanies = useMemo(() => {
    if (!userEmail) return []
    return (
      realEstates?.data?.filter((c: any) =>
        c.adminEmails?.some((e: string) => e.toLowerCase() === userEmail)
      ) || []
    )
  }, [realEstates, userEmail])

  const isLoading = domainsLoading || realEstatesLoading

  return (
    <Modal
      title={`Інформація про користувача: ${user?.name || user?.email || ''}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : user ? (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text strong>Email: {user.email}</Text>

          <Section
            title="Домени адміністратора:"
            emptyText="Не є адміністратором жодного домену"
            maxHeight={120}
            data={userDomains}
            renderItem={(d: any) => d.name}
          />

          <Divider />

          <Section
            title="Компанії адміністратора:"
            emptyText="Не є адміністратором жодної компанії"
            maxHeight={120}
            data={userCompanies}
            renderItem={(c: any) => c.companyName}
          />
        </Space>
      ) : null}
    </Modal>
  )
}

const Section: React.FC<{
  title: string
  emptyText: string
  maxHeight: number
  data: any[]
  renderItem: (item: any) => string
}> = ({ title, emptyText, maxHeight, data, renderItem }) => (
  <div>
    <Text strong style={{ marginBottom: 8, display: 'block' }}>
      {title}
    </Text>

    {data.length > 0 ? (
      <div style={{ maxHeight, overflowY: 'auto' }}>
        <List
          size="small"
          dataSource={data}
          renderItem={(item) => (
            <List.Item>
              <Text strong>{renderItem(item)}</Text>
            </List.Item>
          )}
        />
      </div>
    ) : (
      <Empty description={emptyText} />
    )}
  </div>
)

export default UserFormModal
