import TableCard from '@components/UI/TableCard'
import MyServicesHeader from '@components/Tables/MyServices/Header'
import MyServicesTable from '@components/Tables/MyServices/Table'
import { useGetCustomServicesQuery } from '@common/api/customServicesApi/customServices.api'
import { useState } from 'react'

const MyServicesBlock: React.FC = () => {
  const { data: servicesData } = useGetCustomServicesQuery({})
  const [selectedService, setSelectedService] = useState<string>()

  const serviceOptions =
    servicesData?.data?.map((service) => ({
      value: service._id,
      label: service.name ,
    })) || []

  return (
    <TableCard
      title={
        <MyServicesHeader
          domainOptions={serviceOptions}
          selectedDomain={selectedService}
          onDomainChange={setSelectedService}
        />
      }
    >
      {}
      {selectedService && <MyServicesTable serviceId={selectedService} />}
    </TableCard>
  )
}

export default MyServicesBlock