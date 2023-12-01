// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import Domain from '@common/modules/models/Domain'
import { getCurrentUser } from '@utils/getCurrentUser'
import start, { ExtendedData } from '@pages/api/api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtendedData>
) {
  const { user } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET':
      try {
        await getRoleValidate(user.roles[0], req.query.id, user.email)
        const realEstates = await getCompanies(req.query.id)
        const formatedRealEstates = await getCompaniesFormattedData(realEstates)
        return res
          .status(200)
          .json({ success: true, data: formatedRealEstates })
      } catch (error) {
        console.log(error)
        return res.status(400).json({ success: false, message: error.message })
      }
  }
}

async function getRoleValidate(
  role: string,
  domainId: string,
  userEmail: string
) {
  switch (role) {
    case 'GlobalAdmin':
      //для глобал адміна умови немає.
      break
    case 'DomainAdmin':
      const domainObject = await Domain.findOne({
        _id: domainId,
        adminEmails: userEmail,
      })
      if (!domainObject) {
        throw new Error(
          'In the domain admin does not have the rights to check this domain'
        )
      }
      break
    case 'User':
      const { domain } = await RealEstate.findOne({
        adminEmails: { $in: [userEmail] },
      })

      if (domain.toString() !== domainId) {
        throw new Error(
          'In the domain admin does not have the rights to check this domain'
        )
      }
      break
    default:
      break
  }
}

async function getCompanies(domainId: string) {
  const realEstates = await RealEstate.find({
    domain: { $in: [domainId] },
  }).select('totalArea companyName -_id')

  if (realEstates.length === 0) {
    throw new Error('There are no companies yet')
  }
  return realEstates
}

export function getCompaniesFormattedData(realEstates) {
  const result = {
    companies: {
      companyNames: [],
      totalAreas: [],
      areasPercentage: [],
    },
    totalArea: 0,
  }
  realEstates.forEach(({ companyName, totalArea }) => {
    //Перевіряємо чи є така компанія
    const index = result.companies.companyNames.indexOf(companyName)
    if (index !== -1) {
      //Якщо є то досумовуємо площу
      result.companies.totalAreas[index] += totalArea
      result.totalArea += totalArea
    } else {
      //Якщо ні то закидуємо нову
      result.companies.companyNames.push(companyName)
      result.companies.totalAreas.push(totalArea)
      result.totalArea += totalArea
    }
  })
  //Після того як ми вирахували загальну площу, можемо нарахувати проценти
  result.companies.totalAreas.forEach((companyArea) => {
    //Вираховуємо кожен відсоток площі компанії від суми площ
    const currentAreaPercent: number = (companyArea / result.totalArea) * 100
    //Зберігаємо цей відсоток скорочуючи до двох знаків після коми
    result.companies.areasPercentage.push(Number(currentAreaPercent.toFixed(2)))
  })
  return result
}
