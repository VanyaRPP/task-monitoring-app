import { expect } from '@jest/globals'
import handler from '../../../pages/api/domain/[id]/index'

import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { users, domains } from '@utils/testData'
import {mockLoginAs} from "@utils/mockLoginAs"

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Domain API - DELETE', () => {
    it('should delete domain as GlobalAdmin - success', async () => {
        await mockLoginAs(users.globalAdmin)

        const mockReq = {
            method: 'DELETE',
            query: { id: domains[0]._id },
        } as any
        const mockRes = {
            status: jest.fn(() => mockRes),
            json: jest.fn(),
        } as any

        await handler(mockReq, mockRes)

        const response = {
            status: mockRes.status,
            data: mockRes.json.mock.lastCall[0].data,
        }

        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.data).toBe('Domain ' + domains[0]._id + ' was deleted')
    })
    it('should show message domain not found as GlobalAdmin - success', async () => {
        const testId = '64d68421d9ba2fc8fea79d79'
        await mockLoginAs(users.globalAdmin)

        const mockReq = {
            method: 'DELETE',
            query: { id: testId },
        } as any
        const mockRes = {
            status: jest.fn(() => mockRes),
            json: jest.fn(),
        } as any

        await handler(mockReq, mockRes)

        const response = {
            status: mockRes.status,
            data: mockRes.json.mock.lastCall[0].data,
        }

        expect(response.status).toHaveBeenCalledWith(400)
        expect(response.data).toBe('Domain ' + testId + ' was not found')
    })
})



