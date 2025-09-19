/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import mongoose from 'mongoose'
import Domain from '@modules/models/Domain'
import Street from '@modules/models/Street'
import Service from '@modules/models/Service'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import _uniqBy from 'lodash/uniqBy'
import { RestFilled } from '@ant-design/icons'
start()

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	const { isGlobalAdmin, isDomainAdmin, isUser, user } = await getCurrentUser(
		req,
		res
	)

	switch (req.method) {
		case 'GET':
			try {
				const { page = 1, limit = 10, domainId } = req.query
				const pageNum = parseInt(page as string, 10)
				const limitNum = parseInt(limit as string, 10)

				if (isUser) {
					return res.status(200).json({ success: true, data: [], totalCount: 0 })
				}

				const filter: any = {}
				if (domainId && typeof domainId === 'string') {
					if (mongoose.Types.ObjectId.isValid(domainId)) {
						filter.domainId = new mongoose.Types.ObjectId(domainId)
					} else {
						return res.status(400).json({
							success: false,
							message: 'Invalid domainId format',
						})
					}
				}

				let streets: any[] = [];
				let totalCount = 0;

				if (isGlobalAdmin) {
					totalCount = await Street.countDocuments(filter)
					streets = await Street.find(filter).skip((pageNum - 1) * limitNum).limit(limitNum)
				} else if (isDomainAdmin) {
					const adminDomains = await Domain.find({
						adminEmails: user.mail,
					}).select('streets')

					if (!adminDomains.length) {
						return res.status(200).json({ success: true, data: [], totalCount: 0 })
					}

					const streetIds = adminDomains.flatMap((domain) => domain.streets)

					filter._id = { $in: streetIds }

					totalCount = await Street.countDocuments(filter)
					streets = await Street.find(filter).skip((pageNum - 1) * limitNum).limit(limitNum)
				}

				const streetIds = streets.map((s) => s._id)
				const servicesWithStreets = await Service.find({
					street: { $in: streetIds },
				})

				const result = streets.map((street) => ({
					...street._doc,
					hasService: servicesWithStreets.some(
						(service) => service.street.toString() === street._id.toString()
					),
				}))

				return res.status(200).json({
					success: true,
					data: result,
					totalCount,
				})
			} catch (error) {
				return res.status(400).json({ success: false, error: error.message })
			}
		case 'POST':
			try {
				if (isGlobalAdmin) {
					const street = await Street.create(req.body)
					return res.status(200).json({ success: true, data: street })
				} else {
					return res
						.status(400)
						.json({ success: false, message: 'not allowed' })
				}
			} catch (error) {
				return res.status(400).json({ success: false })
			}
	}
}