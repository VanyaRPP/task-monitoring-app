import { matchCompany } from './bankHelper'
import { ITransaction } from './transactionTypes'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'

const mockCompanies: IRealestate[] = [
    {
        _id: '1',
        companyName: 'Sport Space',
        account: 'UA123',
    } as IRealestate,
    {
        _id: '2',
        companyName: 'Nude',
        account: 'UA456',
    } as IRealestate,
]

const companies: IRealestate[] = [
    {
        _id: 'sport-space-id',
        companyName: 'Sport Space',
        account: undefined,
    } as IRealestate,
    {
        _id: 'vityuk-id',
        companyName: 'Вітюк Дмитро Олександрович',
        account: 'UA293220010000026205305849120',
    } as IRealestate,
    {
        _id: 'nude-id',
        companyName: 'Nude',
        account: undefined,
    } as IRealestate,
    {
        _id: 'olimp-id',
        companyName: 'OlimpDigital',
        account: undefined,
    } as IRealestate,
]

describe('matchCompany', () => {
    it('should match by account', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UA123',
            AUT_CNTR_NAM: 'Some Company',
        } as ITransaction

        const result = matchCompany(transaction, mockCompanies)

        expect(result).toEqual({
            companyId: '1',
            matchedBy: 'account',
        })
    })

    it('should NOT match транзитний рахунок', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UA123',
            AUT_CNTR_NAM: 'Транз.рахунок платежi',
        } as ITransaction

        const result = matchCompany(transaction, mockCompanies)

        expect(result).toEqual({
            companyId: null,
            matchedBy: null,
        })
    })

    it('should fallback to previousCompanyId', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UNKNOWN',
            AUT_CNTR_NAM: 'Random',
            previousCompanyId: '2',
        } as ITransaction

        const result = matchCompany(transaction, mockCompanies)

        expect(result).toEqual({
            companyId: '2',
            matchedBy: 'previous',
        })
    })

    it('should return null if nothing matched', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UNKNOWN',
            AUT_CNTR_NAM: 'Random',
        } as ITransaction

        const result = matchCompany(transaction, mockCompanies)

        expect(result).toEqual({
            companyId: null,
            matchedBy: null,
        })
    })

    it('should ignore companies without account', () => {
        const companies = [
            {
                _id: '3',
                companyName: 'No Account Company',
            } as IRealestate,
        ]

        const transaction = {
            AUT_CNTR_ACC: 'UA999',
            AUT_CNTR_NAM: 'Test',
        } as ITransaction

        const result = matchCompany(transaction, companies)

        expect(result).toEqual({
            companyId: null,
            matchedBy: null,
        })
    })

    it('should match Вітюк by account', () => {
        const transaction: ITransaction = {
            AUT_CNTR_ACC: 'UA293220010000026205305849120',
            AUT_CNTR_NAM: 'Вітюк Дмитро Олександрович',
            previousCompanyId: undefined,
        } as ITransaction

        const result = matchCompany(transaction, companies)

        expect(result).toEqual({
            companyId: 'vityuk-id',
            matchedBy: 'account',
        })
    })

    it('should match Шептієва (Sport Space) by previousCompanyId, ignoring транзитний рахунок', () => {
        const transaction: ITransaction = {
            AUT_CNTR_ACC: 'UA293052990000029023866100110', // транзит
            AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
            previousCompanyId: 'sport-space-id',
        } as ITransaction

        const result = matchCompany(transaction, companies)

        expect(result).toEqual({
            companyId: 'sport-space-id',
            matchedBy: 'previous',
        })
    })
})

