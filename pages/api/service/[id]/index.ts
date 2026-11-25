import Domain from '@modules/models/Domain'
import Service from '@modules/models/Service'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

  const { isGlobalAdmin, isDomainAdmin, user } = await getCurrentUser(req, res)
  const id = req.query.id as string

  // A DomainAdmin reaches only the services of the domains they administer, so
  // the ownership condition is part of the write query itself.
  const getAdminDomainIds = async (): Promise<string[]> =>
    (await Domain.distinct('_id', { adminEmails: user.email })).map(String)

  switch (req.method) {
    case 'DELETE':
      try {
        if (!isGlobalAdmin && !isDomainAdmin) {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }

        const service = await Service.findOneAndDelete({
          _id: id,
          ...(!isGlobalAdmin && {
            domain: { $in: await getAdminDomainIds() },
          }),
        })

        if (!service) {
          return res.status(400).json({
            success: false,
            data: 'Service ' + id + ' was not found',
          })
        }

        return res.status(200).json({
          success: true,
          data: 'Service ' + id + ' was deleted',
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }

    case 'PATCH':
      try {
        // Update operators ($set, $unset, ...) would get around the check of
        // the target domain below.
        const hasOperators = Object.keys(req.body).some((key) =>
          key.startsWith('$')
        )

        if ((!isGlobalAdmin && !isDomainAdmin) || hasOperators) {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }

        const adminDomainIds = isGlobalAdmin ? null : await getAdminDomainIds()

        // Both ends are checked: the domain the service is moved to...
        if (adminDomainIds && !adminDomainIds.includes(req.body.domain)) {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }

        // ...and the one it currently belongs to.
        const service = await Service.findOneAndUpdate(
          {
            _id: id,
            ...(adminDomainIds && { domain: { $in: adminDomainIds } }),
          },
          req.body,
          { returnDocument: 'after' }
        )

        if (!service) {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }

        return res.status(200).json({ success: true, data: service })
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }
  }
}
