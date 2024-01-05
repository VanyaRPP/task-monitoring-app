import type { NextApiRequest, NextApiResponse } from 'next'
import Payment from '@common/modules/models/Payment'
import start, { ExtendedData } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtendedData>
) {
  switch (req.method) {
    case 'DELETE':
      try {
        const { isDomainAdmin, isUser, user, isGlobalAdmin } =
        await getCurrentUser(req, res)
        const { ids } = req.body;
        
        // TODO: ability to delete multiple payments by DomainAdmin
        if(!isGlobalAdmin)
          return res.status(400).json({
            success: false,
            data: 'Deletion requires Global Admin role',
          });

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({
            success: false,
            data: 'Invalid or empty list of payment IDs',
          });
        }

        const result = await Payment.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount > 0) {
          return res.status(200).json({
            success: true,
            data: `${result.deletedCount} payment(s) were deleted`,
          });
        } else {
          return res.status(400).json({
            success: false,
            data: 'No payments were found or deleted',
          });
        }
      } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
    default:
      res.status(405).end();
  }
}
