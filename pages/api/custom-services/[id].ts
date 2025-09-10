import CustomService from '@modules/models/CustomService'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import Domain from '@modules/models/Domain'

start()

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	const { isGlobalAdmin, isDomainAdmin } = await getCurrentUser(req, res)
	const { id } = req.query

	if (req.method === 'DELETE') {
		try {
			if (!isGlobalAdmin && !isDomainAdmin) {
				return res.status(400).json({
					success: false,
					message: 'Not allowed',
				})
			}

			if (!id) {
				return res.status(400).json({
					success: false,
					message: 'Missing service ID',
				})
			}

			const customService = await CustomService.findByIdAndDelete(id)

			await Domain.updateMany(
				{ 'customServices.services': id },
				{ $pull: { 'customServices.$[].services': id } }
			)

			if (!customService) {
				return res.status(404).json({
					success: false,
					message: `Custom service with ID ${id} not found`,
				})
			}

			return res.status(200).json({
				success: true,
				data: `Custom service with ID ${id} was deleted`,
			})
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: 'Internal Server Error',
				error: error.message,
			})
		}
	}

	return res.status(405).json({
		success: false,
		message: `Method ${req.method} Not Allowed`,
	})
}