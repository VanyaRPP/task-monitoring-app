import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - CUSTOM', () => {
  describe('props: { company }', () => {
    it('should NOT load when company = null', () => {
      const company: Partial<IRealestate> = null

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Custom })
      )
    })
    it('should NOT load when company = { ... }', () => {
      const company: Partial<IRealestate> = {
        discount: 1000,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Custom })
      )
    })
  })
  describe('props: { service }', () => {
    it('should NOT load when service = null', () => {
      const service: Partial<IService> = null

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Custom })
      )
    })
    it('should NOT load when service = { ... }', () => {
      const service: Partial<IService> = {
        rentPrice: 0,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Custom })
      )
    })
  })
  describe('props: { payment }', () => {
    it('should NOT load when payment = null', () => {
      const payment: Partial<IPayment> = null

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Custom })
      )
    })
    it('should NOT load when payment = { invoice: null }', () => {
      const payment: Partial<IPayment> = {
        invoice: null,
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Custom })
      )
    })
    it('should NOT load when payment = { invoice: [] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Custom })
      )
    })
    it('should NOT load when payment = { invoice: [Electricity] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            name: 'Custom',
            type: ServiceType.Electricity,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Custom })
      )
    })
    it('should load when payment = { invoice: [Custom] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            name: 'Custom',
            type: ServiceType.Custom,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).toContainEqual({
        name: 'Custom',
        type: ServiceType.Custom,
        price: 1000,
        sum: 1000,
      })
    })
  })
  describe('props: { service, company, prevPayment }', () => {
    it('should NOT load when service = null, company = null, prevPayment = null', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = null

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Custom })
      )
    })
    it('should NOT load when service = null, company = null, prevPayment = { invoice: [Custom] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Custom,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Custom })
      )
    })
    it('should NOT load when service = null, company = null, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Custom })
      )
    })
    it('should NOT load when service = null, company = { cleaning: 1000 }, prevPayment = { invoice: [Custom] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = {
        cleaning: 1000,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Custom,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Custom })
      )
    })
    it('should NOT load when service = null, company = { cleaning: 1000 }, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = {
        cleaning: 1000,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning })
      )
    })

    it('should load custom invoice from company custom service when service custom service is missing', () => {
      const service: Partial<IService> = {
        customServices: [],
      }
      const company: Partial<IRealestate> = {
        customServices: [
          {
            _id: '65b8a9f4a35a75f7da9f1010' as any,
            label: 'Інтернет',
            fieldName: 'internetPrice',
            price: 250,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Custom,
          name: 'Інтернет',
          fieldName: 'internetPrice',
          price: 250,
          sum: 250,
        })
      )
    })

    it('should prefer company custom service price when service custom service exists with zero price', () => {
      const service: Partial<IService> = {
        customServices: [
          {
            _id: '65b8a9f4a35a75f7da9f1011' as any,
            label: 'Інтернет',
            fieldName: 'internetPrice',
            price: 0,
          },
        ],
      }
      const company: Partial<IRealestate> = {
        customServices: [
          {
            _id: '65b8a9f4a35a75f7da9f1011' as any,
            label: 'Інтернет',
            fieldName: 'internetPrice',
            price: 300,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Custom,
          name: 'Інтернет',
          fieldName: 'internetPrice',
          price: 300,
          sum: 300,
        })
      )
    })
  })

  // Fallback to the same custom-service row of the previous month's payment
  // when neither company nor service defines a price. Lets the user carry
  // over an established price into a new month without re-entering it.
  describe('prevPayment fallback for missing custom-service price', () => {
    const prevWithInternet: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Custom,
          name: 'Інтернет',
          fieldName: 'internetPrice',
          price: 250,
          sum: 250,
        },
      ],
    }

    it('loads a Custom row from prevPayment when service is null and company is null', () => {
      const invoices = getInvoices({
        service: null,
        company: null,
        prevPayment: prevWithInternet,
      })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Custom,
          fieldName: 'internetPrice',
          price: 250,
          sum: 250,
        })
      )
    })

    it('loads a Custom row from prevPayment when service.customServices=[] and company.customServices=[]', () => {
      const invoices = getInvoices({
        service: { customServices: [] },
        company: { customServices: [] },
        prevPayment: prevWithInternet,
      })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Custom,
          fieldName: 'internetPrice',
          price: 250,
          sum: 250,
        })
      )
    })

    it('prefers company over service over prev (company wins)', () => {
      const invoices = getInvoices({
        service: {
          customServices: [
            {
              _id: '65b8a9f4a35a75f7da9f1011' as any,
              label: 'Інтернет',
              fieldName: 'internetPrice',
              price: 200,
            },
          ],
        },
        company: {
          customServices: [
            {
              _id: '65b8a9f4a35a75f7da9f1011' as any,
              label: 'Інтернет',
              fieldName: 'internetPrice',
              price: 300,
            },
          ],
        },
        prevPayment: prevWithInternet,
      })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Custom,
          fieldName: 'internetPrice',
          price: 300,
        })
      )
    })

    it('prefers service over prev when company has no override', () => {
      const invoices = getInvoices({
        service: {
          customServices: [
            {
              _id: '65b8a9f4a35a75f7da9f1011' as any,
              label: 'Інтернет',
              fieldName: 'internetPrice',
              price: 200,
            },
          ],
        },
        company: null,
        prevPayment: prevWithInternet,
      })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Custom,
          fieldName: 'internetPrice',
          price: 200,
        })
      )
    })

    it('merges Custom rows from different sources by fieldName', () => {
      const invoices = getInvoices({
        service: {
          customServices: [
            {
              _id: 'aa' as any,
              label: 'Прибирання',
              fieldName: 'cleaningCustom',
              price: 50,
            },
          ],
        },
        company: null,
        prevPayment: {
          invoice: [
            {
              type: ServiceType.Custom,
              name: 'Інтернет',
              fieldName: 'internetPrice',
              price: 250,
              sum: 250,
            },
          ],
        },
      })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Custom,
          fieldName: 'cleaningCustom',
          price: 50,
        })
      )
      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Custom,
          fieldName: 'internetPrice',
          price: 250,
        })
      )
    })

    it('does not pick up prev invoice rows of a non-Custom type with matching fieldName', () => {
      const invoices = getInvoices({
        service: null,
        company: null,
        prevPayment: {
          invoice: [
            {
              type: ServiceType.Electricity,
              fieldName: 'internetPrice',
              price: 999,
              sum: 999,
            },
          ],
        },
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Custom })
      )
    })

    it('uses prev row name and serviceId when service/company are missing', () => {
      const invoices = getInvoices({
        service: null,
        company: null,
        prevPayment: {
          invoice: [
            {
              type: ServiceType.Custom,
              name: 'Інтернет',
              fieldName: 'internetPrice',
              price: 250,
              sum: 250,
              serviceId: 'svc-xyz',
            },
          ],
        },
      })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Custom,
          fieldName: 'internetPrice',
          name: 'Інтернет',
          serviceId: 'svc-xyz',
        })
      )
    })
  })
})
