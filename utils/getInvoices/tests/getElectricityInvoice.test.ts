import { getElectricityInvoice } from '../index'
import { ServiceType } from '@utils/constants'

describe('getElectricityInvoice (Bulk Payments logic)', () => {
    it('має брати amount/lastAmount з prevPayment, якщо він валідний (не 0)', () => {

        const mockService = {
            electricityPrice: 5.5,
            losses: 12.85,
        }

        const mockPrevInvoicesCollection = {
            [ServiceType.Electricity]: {
                type: ServiceType.Electricity,
                amount: 1500,
                price: 5.0,
            },
        }

        const result = getElectricityInvoice({
            service: mockService as any,
            currInvoicesCollection: {},
            prevInvoicesCollection: mockPrevInvoicesCollection as any,
        })

        expect(result).toBeDefined()
        expect(result?.amount).toBe(1500)
        expect(result?.lastAmount).toBe(1500)
        expect(result?.losses).toBe(12.85)
    })

    it('має повертати amount/lastAmount як 0, якщо prevPayment відсутній', () => {
        const mockService = {
            electricityPrice: 5.5,
            losses: 12.85,
        }

        const mockPrevInvoicesCollection = {}

        const result = getElectricityInvoice({
            service: mockService as any,
            currInvoicesCollection: {},
            prevInvoicesCollection: mockPrevInvoicesCollection as any,
        })

        expect(result).toBeDefined()
        expect(result?.amount).toBe(0)
        expect(result?.lastAmount).toBe(0)
    })
})