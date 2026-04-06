import { matchCompany, getResolvedDescription } from './bankHelper'
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

    it('should NOT match транзитний рахунок if OSND does not contain company name', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UA123',
            AUT_CNTR_NAM: 'Транз.рахунок платежi',
            OSND: 'Unrelated description',
        } as ITransaction

        const result = matchCompany(transaction, mockCompanies)

        expect(result).toEqual({
            companyId: null,
            matchedBy: null,
        })
    })

    it('should use previousCompanyId for транзитний рахунок', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UA123',
            AUT_CNTR_NAM: 'Транз.рахунок платежi',
            previousCompanyId: 'some-company-id',
        } as ITransaction

        const result = matchCompany(transaction, mockCompanies)

        expect(result).toEqual({
            companyId: 'some-company-id',
            matchedBy: 'previous',
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

    it('should prioritize account over previousCompanyId', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UA123',
            AUT_CNTR_NAM: 'Some Company',
            previousCompanyId: '2',
        } as ITransaction

        const result = matchCompany(transaction, mockCompanies)

        expect(result).toEqual({
            companyId: '1',
            matchedBy: 'account',
        })
    })

    it('should return null if AUT_CNTR_ACC is empty', () => {
        const transaction = {
            AUT_CNTR_ACC: '',
            AUT_CNTR_NAM: 'Some Company',
            previousCompanyId: '2',
        } as ITransaction

        const result = matchCompany(transaction, mockCompanies)

        expect(result).toEqual({
            companyId: '2',
            matchedBy: 'previous',
        })
    })

    it('should return null if AUT_CNTR_ACC is undefined', () => {
        const transaction = {
            AUT_CNTR_ACC: undefined,
            AUT_CNTR_NAM: 'Some Company',
            previousCompanyId: '2',
        } as ITransaction

        const result = matchCompany(transaction, mockCompanies)

        expect(result).toEqual({
            companyId: '2',
            matchedBy: 'previous',
        })
    })

    it('should return previousCompanyId if companies array is empty but previousCompanyId exists', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UA123',
            AUT_CNTR_NAM: 'Some Company',
            previousCompanyId: '2',
        } as ITransaction

        const result = matchCompany(transaction, [])

        expect(result).toEqual({
            companyId: '2',
            matchedBy: 'previous',
        })
    })

    it('should match first company if multiple have same account', () => {
        const companiesWithDuplicate = [
            { _id: '1', companyName: 'First', account: 'UA123' } as IRealestate,
            { _id: '2', companyName: 'Second', account: 'UA123' } as IRealestate,
        ]

        const transaction = {
            AUT_CNTR_ACC: 'UA123',
            AUT_CNTR_NAM: 'Some Company',
        } as ITransaction

        const result = matchCompany(transaction, companiesWithDuplicate)

        expect(result).toEqual({
            companyId: '1',
            matchedBy: 'account',
        })
    })

    it('should not match if account has different case', () => {
        const transaction = {
            AUT_CNTR_ACC: 'ua123',
            AUT_CNTR_NAM: 'Some Company',
        } as ITransaction

        const result = matchCompany(transaction, mockCompanies)

        expect(result).toEqual({
            companyId: null,
            matchedBy: null,
        })
    })

    it('should not match if account does not exist in companies', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UA999',
            AUT_CNTR_NAM: 'Some Company',
        } as ITransaction

        const result = matchCompany(transaction, mockCompanies)

        expect(result).toEqual({
            companyId: null,
            matchedBy: null,
        })
    })

    it('should handle AUT_CNTR_NAM undefined', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UA123',
            AUT_CNTR_NAM: undefined,
        } as ITransaction

        const result = matchCompany(transaction, mockCompanies)

        expect(result).toEqual({
            companyId: '1',
            matchedBy: 'account',
        })
    })

    it('should not match if account has leading/trailing spaces', () => {
        const transaction = {
            AUT_CNTR_ACC: ' UA123 ',
            AUT_CNTR_NAM: 'Some Company',
        } as ITransaction

        const result = matchCompany(transaction, mockCompanies)

        expect(result).toEqual({
            companyId: null,
            matchedBy: null,
        })
    })
})

describe('getResolvedDescription', () => {
    it('should return account number if matched by account', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UA293220010000026205305849120',
            AUT_CNTR_NAM: 'Вітюк Дмитро Олександрович',
            OSND: 'Оплата послуг',
        } as ITransaction

        const result = getResolvedDescription(transaction, companies)

        expect(result).toBe('UA293220010000026205305849120')
    })

    it('should return original OSND if matched by previousCompanyId', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UNKNOWN_ACC',
            previousCompanyId: 'sport-space-id',
            OSND: 'Абонемент',
        } as ITransaction

        const result = getResolvedDescription(transaction, companies)

        expect(result).toBe('Абонемент')
    })

    it('should return original OSND if nothing matched', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UNKNOWN_ACC',
            OSND: 'Просто переказ',
        } as ITransaction

        const result = getResolvedDescription(transaction, companies)

        expect(result).toBe('Просто переказ')
    })

    it('should return original OSND for транзитний рахунок', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UA293052990000029023866100110',
            AUT_CNTR_NAM: 'Транз.рахунок платежi',
            OSND: 'Транзитний платіж',
        } as ITransaction

        const result = getResolvedDescription(transaction, companies)

        expect(result).toBe('Транзитний платіж')
    })

    it('should return AUT_CNTR_ACC even if OSND is present when matched by account', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UA123',
            AUT_CNTR_NAM: 'Some Company',
            OSND: 'Some description',
        } as ITransaction

        const result = getResolvedDescription(transaction, mockCompanies)

        expect(result).toBe('UA123')
    })

    it('should return OSND if AUT_CNTR_ACC is empty but matched by account', () => {
        const companiesWithEmptyAccount = [
            { _id: '1', companyName: 'Test', account: '' } as IRealestate,
        ]

        const transaction = {
            AUT_CNTR_ACC: '',
            AUT_CNTR_NAM: 'Some Company',
            OSND: 'Empty account description',
        } as ITransaction

        const result = getResolvedDescription(transaction, companiesWithEmptyAccount)

        expect(result).toBe('Empty account description')
    })

    it('should return empty string if OSND is empty and not matched by account', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UNKNOWN',
            OSND: '',
        } as ITransaction

        const result = getResolvedDescription(transaction, mockCompanies)

        expect(result).toBe('')
    })

    it('should return OSND if companies array is empty', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UA123',
            OSND: 'No companies',
        } as ITransaction

        const result = getResolvedDescription(transaction, [])

        expect(result).toBe('No companies')
    })

    it('should return AUT_CNTR_ACC if matched by account and OSND is undefined', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UA123',
            AUT_CNTR_NAM: 'Some Company',
            OSND: undefined,
        } as ITransaction

        const result = getResolvedDescription(transaction, mockCompanies)

        expect(result).toBe('UA123')
    })

    it('should return OSND if matched by previous and AUT_CNTR_ACC is present', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UNKNOWN_ACC',
            previousCompanyId: '2',
            OSND: 'Previous match description',
        } as ITransaction

        const result = getResolvedDescription(transaction, mockCompanies)

        expect(result).toBe('Previous match description')
    })

    it('should handle undefined OSND gracefully', () => {
        const transaction = {
            AUT_CNTR_ACC: 'UNKNOWN',
            OSND: undefined,
        } as ITransaction

        const result = getResolvedDescription(transaction, mockCompanies)

        expect(result).toBe('')
    })
})
