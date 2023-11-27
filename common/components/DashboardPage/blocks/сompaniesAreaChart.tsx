import React, { useEffect, useState } from 'react';
import Chart from '@common/components/Chart';
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api';
// import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
// import { Roles } from '@utils/constants'
import { useRouter } from 'next/router'
import { AppRoutes, realValues } from '@utils/constants'

const CompaniesAreaChart:React.FC = () => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.REAL_ESTATE
  const { data: userResponse } = useGetCurrentUserQuery()
  const [rentParts, setRentParts] = useState<number[]>([]);
  const [companyNames, setCompanyNames] = useState<string[]>([]);
  // const isGlobalAdmin = userResponse?.roles?.includes(Roles.DOMAIN_ADMIN)
  // const isUser = userResponse?.roles?.includes(Roles.USER)
  
  // const {
  //   data: realEstates,
  // } = useGetAllRealEstateQuery({})

 

  // const {
  //   data: realEstates,
  // } = useGetAllRealEstateQuery({
  //   domainId: realEstate.domainsFilter[0].value,
  //   limit: isOnPage ? 0 : 5,
  // })

  const createData = () => {
    const rentParts: number[] = [];
    const companyNames: string[] = [];
    for (const element of realValues.data) {
      rentParts.push(element.totalArea)
      companyNames.push(element.companyName)
    }
    setRentParts(rentParts);
    setCompanyNames(companyNames);
  };


  useEffect(() => {
    createData()
   }, [realValues])


  return (
    <Chart names={companyNames} values={rentParts} />
  );
};

export default CompaniesAreaChart;
