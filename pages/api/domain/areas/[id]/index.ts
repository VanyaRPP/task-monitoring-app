// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import Domain from '@common/modules/models/Domain'
import { getCurrentUser } from '@utils/getCurrentUser'
import start, { ExtendedData } from '@pages/api/api.config'

start()
// ми робимо квері по домейнІд
// api/domain/areas/[id]
async function getDataMapping(
  role: string,
  domainId: string,
  userEmail: string
) {
  switch (role) {
    case 'GlobalAdmin':
    //для глобал адміна умови немає. якщо пройшли валідацію на глобал адміна ми беремо домейн ід і
    // ->виймаємо всі компанії за цим доменом
    case 'DomainAdmin':
      //для домейн адміна є умова.
      // ми беремо з квері ід
      // робимо в файндОне по домейнІд з куері доменів
      const domainObject = await Domain.findById(domainId)
      // якщо знаходить
      // ->виймаємо всі компанії за цим доменом
      // якщо не знаходить - кидаємо помилку, що у домейн адміна немає прав перевіряти цей домейн
      if (!domainObject) {
        throw new Error(
          'In the domain admin does not have the rights to check this domain'
        )
      }
      //в такому випадку немає перевірки чи має цей домен доступ до домену з квері чи ні.
      //просто перевіряємо чи існує такий взагалі, тому пропоную такий варік
      // if(domainObject.adminEmails.find(element => element === userEmail)!==userEmail){
      //   throw new Error('In the domain admin does not have the rights to check this domain')
      // }
      break
    case 'User':
      // для юзера є умова
      // ми беремо з квері ід домену
      // робимо в файндОне по домейнІд з куері по компаніям
      const { domain } = await RealEstate.findOne({
        domain: { $in: [domainId] },
      })
      // знайшли компанію
      // перевіряємо чи компанія має цей домен
      // якщо знаходить
      // ->виймаємо всі компанії за цим доменом
      // якщо не знаходить - кидаємо помилку, що у домейн адміна немає прав перевіряти цей домейн
      if (!domain) {
        throw new Error(
          'In the domain admin does not have the rights to check this domain'
        )
      }
      //аякщо юзер написав http://localhost:3000/api/domain/areas/ід від іншого не свого домену?
      // то потрібно шукати домен по імейлу, а потім порівнювати якщо з квері сбігається з цим то все круто пропоную цей код нижче
      // const {domain} = await RealEstate.findOne({
      //   adminEmails: { $in: [userEmail] },
      // })

      // if(domain.toString()!==domainId){
      //   throw new Error('In the domain admin does not have the rights to check this domain')
      // }
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtendedData>
) {
  const { user } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET':
      try {
        await getDataMapping(user.roles[0], req.query.id, user.email, user.id)
        // **виймаємо всі компанії за цим доменом
        // це означає, що беремо наступну фукнцію вийняти всі компанії по домену (який пройшов валідацію для ролей)
        const realEstates = await getCompanies(req.query.id)
        // готуємо дані, які будемо повертати
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

export function getCompaniesFormattedData(realEstates) {
  const result = {
    companyNames: [],
    totalAreas: [],
    totalArea: 0,
    areasPercentage: [],
  }

  const groupedData: Record<string, number[]> = {}

  realEstates.forEach(({ companyName, totalArea }) => {
    if (!groupedData[companyName]) {
      groupedData[companyName] = []
      result.companyNames.push(companyName)
    }
    groupedData[companyName].push(totalArea)
    result.totalArea += totalArea
  })

  result.companyNames.forEach((companyName) => {
    const areas = groupedData[companyName]
    const totalAreaPercentage = areas.reduce(
      (acc, area) => acc + (area / result.totalArea) * 100,
      0
    )
    result.totalAreas.push(areas.reduce((acc, area) => acc + area, 0))
    result.areasPercentage.push(Number(totalAreaPercentage.toFixed(2)))
  })

  return result
}
