import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { ServiceType } from '@utils/constants'

export const realValues = {
  data: [
    {
      totalArea: 570.7,
      companyName: 'Prime Gym',
    },
    {
      totalArea: 216,
      companyName: 'Kangoo Jumps',
    },
    {
      totalArea: 53.5,
      companyName: 'Olimp Digital',
    },
    {
      totalArea: 109.2,
      companyName: 'Nùde',
    },
    {
      totalArea: 110,
      companyName: 'Bisons',
    },
    {
      totalArea: 67,
      companyName: 'Shyshkov',
    },
    {
      totalArea: 33.9,
      companyName: 'Antonenko',
    },
    {
      totalArea: 124,
      companyName: 'Space Hub',
    },
    {
      totalArea: 353.35,
      companyName: 'TRX Pantera',
    },
    {
      totalArea: 214.3,
      companyName: 'Sport Space',
    },
  ],
}

export const extendedPayment: IExtendedPayment[] = [
  {
    _id: '1',
    _v: 1,
    invoiceNumber: 1,
    type: ServiceType.Electricity,
    invoiceCreationDate: new Date('2023-12-01'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      {
        type: ServiceType.Electricity,
        price: 50,
        sum: 50,
      },
    ],
    provider: { description: 'description' },
    reciever: {
      companyName: 'Test',
      adminEmails: ['admin@test.com'],
      description: 'Description',
    },
    generalSum: 50,
    someUniqueField: '',
  },
  {
    _id: '2',
    _v: 1,
    invoiceNumber: 2,
    type: ServiceType.Water,
    invoiceCreationDate: new Date('2023-12-02'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      {
        type: ServiceType.Water,
        price: 60,
        sum: 60,
      },
    ],
    provider: { description: 'description' },
    reciever: {
      companyName: 'Test',
      adminEmails: ['admin@test.com'],
      description: 'Description',
    },
    generalSum: 60,
    someUniqueField: '',
  },
  {
    _id: '4',
    _v: 1,
    invoiceNumber: 4,
    type: ServiceType.Placing,
    invoiceCreationDate: new Date('2023-12-03'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      {
        type: ServiceType.Placing,
        price: 20,
        sum: 20,
      },
    ],
    provider: { description: 'description' },
    reciever: {
      companyName: 'Test',
      adminEmails: ['admin@test.com'],
      description: 'Description',
    },
    generalSum: 20,
    someUniqueField: '',
  },
]

export const extendedPaymentsSort: IExtendedPayment[] = [
  {
    _id: '5',
    _v: 1,
    invoiceNumber: 5,
    type: ServiceType.Maintenance,
    invoiceCreationDate: new Date('2023-12-06'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      {
        type: ServiceType.Maintenance,
        price: 89,
        sum: 89,
      },
    ],
    provider: { description: 'description' },
    reciever: {
      companyName: 'Test',
      adminEmails: ['admin@test.com'],
      description: 'Description',
    },
    generalSum: 89,
  },
  {
    _id: '6',
    _v: 1,
    invoiceNumber: 6,
    type: ServiceType.GarbageCollector,
    invoiceCreationDate: new Date('2023-12-05'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      {
        type: ServiceType.GarbageCollector,
        price: 120,
        sum: 120,
      },
    ],
    provider: { description: 'description' },
    reciever: {
      companyName: 'Test',
      adminEmails: ['admin@test.com'],
      description: 'Description',
    },
    generalSum: 120,
  },
  {
    _id: '7',
    _v: 1,
    invoiceNumber: 7,
    type: ServiceType.WaterPart,
    invoiceCreationDate: new Date('2023-12-04'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      {
        type: ServiceType.WaterPart,
        price: 213,
        sum: 213,
      },
    ],
    provider: { description: 'description' },
    reciever: {
      companyName: 'Test',
      adminEmails: ['admin@test.com'],
      description: 'Description',
    },
    generalSum: 213,
  },
]

export const extendedPaymentForTestForCorrectValue: IExtendedPayment[] = [
  {
    _id: '8',
    _v: 1,
    invoiceNumber: 8,
    type: ServiceType.Inflicion,
    invoiceCreationDate: new Date('2023-12-08'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      {
        type: ServiceType.Inflicion,
        price: 60,
        sum: 60,
      },
    ],
    provider: { description: 'description' },
    reciever: {
      companyName: 'Test',
      adminEmails: ['admin@test.com'],
      description: 'Description',
    },
    generalSum: 60,
  },
]
