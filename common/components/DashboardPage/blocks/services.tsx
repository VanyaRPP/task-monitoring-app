import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import ServicesHeader from '@common/components/Tables/Services/Header'
import ServicesTable from '@common/components/Tables/Services/Table'
import TableCard from '@common/components/UI/TableCard'
import { isAdminCheck } from '@utils/helpers'


const ServicesBlock = () => {
  const { data: user } = useGetCurrentUserQuery()
  
  return (
    <TableCard title={<ServicesHeader showAddButton={isAdminCheck(user?.roles)} />}>
      <ServicesTable />
    </TableCard>
  )
}

export default ServicesBlock
