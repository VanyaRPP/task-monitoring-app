import {
  DollarOutlined,
  LineChartOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import useKeyCode from '@modules/hooks/useKeyCode'
import { AppRoutes, Roles } from '@utils/constants'
import { Menu as AntdMenu, MenuProps as AntdMenuProps } from 'antd'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { isAdminCheck } from '@utils/helpers'

export type MenuProps = Omit<AntdMenuProps, 'selectedKeys' | 'mode' | 'items'>

export const Menu: React.FC<MenuProps> = (props) => {
  const [isDevMode, setIsDevMode] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { data: user } = useGetCurrentUserQuery()

  const handleSequenceDetected = () => {
    setIsDevMode(!isDevMode)
  }

  useKeyCode('hellodev', handleSequenceDetected, 2000)

  const isDomainAdmin = useMemo(() => {
    return user?.roles?.includes(Roles.DOMAIN_ADMIN)
  }, [user])
  const isGlobalAdmin = useMemo(() => {
    return user?.roles?.includes(Roles.GLOBAL_ADMIN)
  }, [user])

  const items = useMemo<AntdMenuProps['items']>(() => {
    return [
      {
        key: 'payments_submenu',
        type: 'submenu',
        label: 'Платежі',
        icon: <DollarOutlined />,
        children: [
          {
            key: AppRoutes.PAYMENT,
            type: 'item',
            label: (
              <Link href={AppRoutes.PAYMENT}>
                {isGlobalAdmin || isDomainAdmin ? 'Платежі' : 'Мої платежі'}
              </Link>
            ),
          },
          {
            key: AppRoutes.PAYMENT_BULK,
            type: 'item',
            label: (
              <Link href={AppRoutes.PAYMENT_BULK}>Створення рахунків</Link>
            ),
            hidden: !isGlobalAdmin && !isDomainAdmin,
          },
          {
            key: AppRoutes.PAYMENT_CHART,
            type: 'item',
            label: <Link href={AppRoutes.PAYMENT_CHART}>Графік платежів</Link>,
          },
          {
            key: 'bank',
            type: 'item',
            label: <Link href={AppRoutes.BANKTEST}>Банк</Link>,
            hidden: !isAdminCheck(user?.roles),
          },
          {
            key: AppRoutes.PROFIT,
            type: 'item',
            label: <Link href={AppRoutes.PROFIT}>Прибуткі</Link>,
            hidden: !isAdminCheck(user?.roles),
          },
        ].filter(({ hidden }) => !hidden),
      },
      {
        key: 'dashboard_submenu',
        type: 'submenu',
        label: 'Панель управління',
        icon: <LineChartOutlined />,
        children: [
          {
            key: AppRoutes.INDEX,
            type: 'item',
            label: <Link href={AppRoutes.INDEX}>Всі таблиці</Link>,
          },
          {
            key: AppRoutes.STREETS,
            type: 'item',
            label: <Link href={AppRoutes.STREETS}>Вулиці</Link>,
            hidden: !isGlobalAdmin,
          },
          {
            key: AppRoutes.DOMAIN,
            type: 'item',
            label: <Link href={AppRoutes.DOMAIN}>Надавачі послуг</Link>,
          },
          {
            key: AppRoutes.REAL_ESTATE,
            type: 'item',
            label: <Link href={AppRoutes.REAL_ESTATE}>Компанії</Link>,
          },
          {
            key: AppRoutes.SERVICE,
            type: 'item',
            label: <Link href={AppRoutes.SERVICE}>Послуги</Link>,
          },
        ].filter(({ hidden }) => !hidden),
      },
      {
        key: 'user_submenu',
        type: 'submenu',
        label: session?.user?.name || 'Мої',
        icon: <UserOutlined />,
        children: [
          // TODO: dashboard page with customizible layout
          // {
          //   key: AppRoutes.DASHBOARD,
          //   type: 'item',
          //   label: 'Панель',
          //   onClick: () => router.push(AppRoutes.DASHBOARD),
          // },
          {
            key: AppRoutes.PROFILE,
            type: 'item',
            label: <Link href={AppRoutes.PROFILE}>Профіль</Link>,
          },
        ],
      },
      {
        ...(isDevMode && {
          key: 'bank',
          type: 'submenu',
          icon: <UserOutlined />,
          label: 'BAnk',
          onClick: () => router.push(AppRoutes.BANKTEST),
        }),
      },
    ] as AntdMenuProps['items']
  }, [router, session, isGlobalAdmin, isDomainAdmin, isDevMode])

  return (
    <AntdMenu
      selectedKeys={pathname ? [pathname] : []}
      mode="inline"
      items={items}
      {...props}
    />
  )
}
