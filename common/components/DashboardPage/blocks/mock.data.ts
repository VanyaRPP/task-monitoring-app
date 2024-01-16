import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'

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
    type: 'electricityPrice',
    invoiceCreationDate: new Date('2023-12-01'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      { type: 'Service A', price: 10, sum: 10 },
      { type: 'Service B', price: 20, sum: 40 },
    ],
    provider: { description: 'description' },
    reciever: {
      companyName: 'Test',
      adminEmails: ['admin@test.com'],
      description: 'Description',
    },
    generalSum: 50,
  },
  {
    _id: '2',
    _v: 1,
    invoiceNumber: 2,
    type: 'waterPrice',
    invoiceCreationDate: new Date('2023-12-02'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      { type: 'Service A', price: 30, sum: 45 },
      { type: 'Service B', price: 25, sum: 15 },
    ],
    provider: { description: 'description' },
    reciever: {
      companyName: 'Test',
      adminEmails: ['admin@test.com'],
      description: 'Description',
    },
    generalSum: 60,
  },
  {
    _id: '4',
    _v: 1,
    invoiceNumber: 4,
    type: 'placingPrice',
    invoiceCreationDate: new Date('2023-12-03'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      { type: 'Service A', price: 10, sum: 10 },
      { type: 'Service B', price: 10, sum: 10 },
    ],
    provider: { description: 'description' },
    reciever: {
      companyName: 'Test',
      adminEmails: ['admin@test.com'],
      description: 'Description',
    },
    generalSum: 20,
  },
]

export const extendedPaymentsSort: IExtendedPayment[] = [
  {
    _id: '5',
    _v: 1,
    invoiceNumber: 5,
    type: 'maintenancePrice',
    invoiceCreationDate: new Date('2023-12-06'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      { type: 'Service A', price: 44.5, sum: 44.5 },
      { type: 'Service B', price: 44.5, sum: 44.5 },
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
    type: 'garbageCollectorPrice',
    invoiceCreationDate: new Date('2023-12-05'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      { type: 'Service A', price: 60, sum: 60 },
      { type: 'Service B', price: 60, sum: 60 },
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
    type: 'waterPart',
    invoiceCreationDate: new Date('2023-12-04'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      { type: 'Service A', price: 106.5, sum: 106.5 },
      { type: 'Service B', price: 106.5, sum: 106.5 },
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
    type: 'inflicionPrice',
    invoiceCreationDate: new Date('2023-12-08'),
    domain: 'Test_Domain',
    street: 'Klosovskogo',
    company: 'Test Company',
    monthService: '6501beaceab61c2d11fecd87',
    invoice: [
      { type: 'Service A', price: 30, sum: 30 },
      { type: 'Service B', price: 30, sum: 30 },
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