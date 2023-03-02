import React from 'react'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { useSession } from 'next-auth/react'
import { AppRoutes, Roles } from '@utils/constants'
import { useRouter } from 'next/router'
import PaymentsBlock from '../DashboardPage/blocks/payments'

const PaymentsWrapper = () => {
  const { data } = useSession()
  const { pathname } = useRouter()

  const {
    data: userResponse,
    isLoading: userLoading,
    isFetching: userFetching,
  } = useGetUserByEmailQuery(data?.user?.email, {
    skip: !data?.user?.email,
  })
  const isAdmin = userResponse?.data?.role === Roles.ADMIN
  const {
    data: payments,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
  } = useGetAllPaymentsQuery({
    limit: pathname === AppRoutes.PAYMENT ? 200 : 5,
    ...(!isAdmin && { userId: userResponse?.data._id as string }),
  })

  return (
    <PaymentsBlock
      payments={payments}
      isAdmin={isAdmin}
      isLoading={
        paymentsLoading || userLoading || paymentsFetching || userFetching
      }
    />
  )
}

export default PaymentsWrapper
