import { UserOutlined } from '@ant-design/icons'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { AppRoutes, Roles } from '@utils/constants'
import { Avatar, Button, Card, Skeleton, Tag } from 'antd'
import classNames from 'classnames'
import { signIn, signOut, useSession } from 'next-auth/react'
import NextImage from 'next/image'
import { default as Router, default as router } from 'next/router'
import { useState } from 'react'
import s from './style.module.scss'

const LoginUser: React.FC = () => {
  const { data: session, status } = useSession()

  if (session?.user) return <SessionUser image={session?.user?.image} />

  const isLoading = status === 'loading'
  return (
    <div className={s.SignButtons}>
      {isLoading ? (
        <div className={s.SkeletonAvatar}>
          <Skeleton.Avatar />
        </div>
      ) : (
        <>
          <Button
            onClick={() => signIn()}
            ghost
            type="primary"
            className={s.Button}
          >
            Увійти
          </Button>
          <Button
            onClick={() => {
              router.push(AppRoutes.AUTH_SIGN_UP)
            }}
            ghost
            type="primary"
            className={s.Button}
          >
            Зареєструватися
          </Button>
        </>
      )}
    </div>
  )
}

function SessionUser({ image }) {
  const { data: user } = useGetCurrentUserQuery()
  const [menuActive, setMenuActive] = useState(false)

  return (
    <>
      <div
        className={s.Avatar}
        onClick={() => setMenuActive((prevState) => !prevState)}
      >
        <Avatar
          icon={<UserOutlined />}
          size={32}
          src={
            <NextImage
              src={image || undefined}
              width={32}
              height={32}
              alt="avatar"
            />
          }
        />
      </div>

      <div
        onClick={() => setMenuActive(false)}
        className={classNames(s.Info, { [s.Active]: menuActive })}
      >
        <Card onClick={(e) => e.stopPropagation()} className={s.Card}>
          <Avatar
            icon={<UserOutlined />}
            size={100}
            src={
              <NextImage
                src={user?.image || undefined}
                width={100}
                height={100}
                alt="avatar"
              />
            }
          />

          <h2>{user?.name}</h2>
          <p>{user?.email}</p>

          {!user?.roles?.includes(Roles.GLOBAL_ADMIN) && (
            <>
              {user?.roles.length > 0 && (
                <div>
                  Роль:{` `}
                  {user?.roles?.map((item) => (
                    <Tag className={s.cardUserTag} key={item}>
                      {item}
                    </Tag>
                  ))}
                </div>
              )}

              {user && <DomainsCompanies />}
            </>
          )}

          {user?.roles?.includes(Roles.GLOBAL_ADMIN) && (
            <Button type="link" onClick={() => Router.push(AppRoutes.ADMIN)}>
              Панель адміна
            </Button>
          )}

          <div className={s.Buttons}>
            <Button
              type="link"
              block
              onClick={() => Router.push(AppRoutes.PROFILE)}
            >
              Мій профіль
            </Button>
            <Button type="link" block onClick={() => signOut()}>
              Вийти
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}

function DomainsCompanies() {
  const { data: realEstates } = useGetAllRealEstateQuery({})
  const { data: domains = [] } = useGetDomainsQuery({})

  const companies = realEstates?.data || []

  return (
    <>
      {domains.length > 0 && (
        <div>
          Надавачі послуг:{` `}
          {domains.map((item) => (
            <Tag className={s.cardUserTag} key={item.name}>
              {item.name}
            </Tag>
          ))}
        </div>
      )}
      {companies.length > 0 && (
        <div>
          Компанії:{` `}
          {companies.map((item) => (
            <Tag className={s.cardUserTag} key={item.companyName}>
              {item.companyName}
            </Tag>
          ))}
        </div>
      )}
    </>
  )
}

export default LoginUser
