import React, { useState, useEffect } from 'react'
import TableCard from '@components/UI/TableCard'
import MyServicesHeader from '@components/Tables/MyServices/Header'
import MyServicesTable from '@components/Tables/MyServices/Table'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'

const MyServicesBlock: React.FC = () => {
  const { data: domainsData, isLoading } = useGetDomainsQuery({})
  const [selectedDomain, setSelectedDomain] = useState<string | undefined>()

  useEffect(() => {
    if (!selectedDomain && domainsData && domainsData.length > 0) {
      setSelectedDomain(domainsData[0]._id)
    }
  }, [domainsData, selectedDomain])

  const domainOptions =
    domainsData?.map((domain) => ({
      value: domain._id,
      label: domain.name,
    })) || []

  const handleDomainChange = (value: string) => {
    setSelectedDomain(value)
  }

  return (
    <TableCard
      title={
        <MyServicesHeader
          domainOptions={domainOptions}
          selectedDomain={selectedDomain}
          onDomainChange={handleDomainChange}
        />
      }
    >
      <MyServicesTable domainId={selectedDomain} />
    </TableCard>
  )
}

export default MyServicesBlock
