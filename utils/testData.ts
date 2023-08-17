import { Roles } from './constants'

export const users = {
  user: {
    name: 'user',
    email: 'user@example.com',
    roles: [Roles.USER],
  },
  domainAdmin: {
    name: 'domainAdmin',
    email: 'domainAdmin@example.com',
    roles: [Roles.DOMAIN_ADMIN],
  },
  globalAdmin: {
    name: 'globalAdmin',
    email: 'globalAdmin@example.com',
    roles: [Roles.GLOBAL_ADMIN],
  },
}

export const domains = [
  {
    _id: '64d68421d9ba2fc8fea79d11',
    name: 'domain 0',
    adminEmails: [users.domainAdmin.email],
    streets: [],
    description: 'none',
  },
  {
    _id: '64d68421d9ba2fc8fea79d12',
    name: 'domain 1',
    adminEmails: [],
    streets: [],
    description: 'none',
  },
  {
    _id: '64d68421d9ba2fc8fea79d13',
    name: 'domain 2',
    adminEmails: [],
    streets: [],
    description: 'none',
  },
  {
    _id: '64d68421d9ba2fc8fea79d14',
    name: 'domain 3',
    adminEmails: [],
    streets: [],
    description: 'none',
  },
  {
    _id: '64d68421d9ba2fc8fea79d15',
    name: 'domain 4',
    adminEmails: [],
    streets: [],
    description: 'none',
  },
  {
    _id: '64d68421d9ba2fc8fea79d16',
    name: 'domain 5',
    adminEmails: [],
    streets: [],
    description: 'none',
  },
]

export const streets = [
  {
    _id: '64d68421d9ba2fc8fea79d31',
    address: 'street_0',
    city: 'street_0_city',
  },
  {
    _id: '64d68421d9ba2fc8fea79d32',
    address: 'street_1',
    city: 'street_1_city',
  },
  {
    _id: '64d68421d9ba2fc8fea79d33',
    address: 'street_2',
    city: 'street_2_city',
  },
  {
    _id: '64d68421d9ba2fc8fea79d34',
    address: 'street_3',
    city: 'street_3_city',
  },
  {
    _id: '64d68421d9ba2fc8fea79d35',
    address: 'street_4',
    city: 'street_4_city',
  },
]

// TODO: fix tests
export const realEstates = [
  {
    _id: '64d68421d9ba2fc8fea79d21',
    domain: domains[0]._id,
    street: streets[0]._id,
    companyName: 'company_0',
    adminEmails: [users.user.email],
    pricePerMeter: 10,
    description: 'none',
    servicePricePerMeter: 10,
    totalArea: 10,
    garbageCollector: 11,
    waterPart: 0,
    rentPart: 0,
    inflicion: false,
  },
  {
    _id: '64d68421d9ba2fc8fea79d22',
    domain: domains[1]._id,
    street: streets[1]._id,
    companyName: 'company_1',
    adminEmails: [users.user.email],
    pricePerMeter: 10,
    servicePricePerMeter: 10,
    description: 'none',
    totalArea: 10,
    garbageCollector: 12,
    waterPart: 0,
    rentPart: 0,
    inflicion: false,
  },
  {
    _id: '64d68421d9ba2fc8fea79d23',
    domain: domains[2]._id,
    street: streets[2]._id,
    companyName: 'company_2',
    description: 'none',
    adminEmails: [users.domainAdmin.email],
    pricePerMeter: 10,
    servicePricePerMeter: 10,
    totalArea: 10,
    garbageCollector: 13,
    waterPart: 0,
    rentPart: 0,
    inflicion: false,
  },

  {
    _id: '64d68421d9ba2fc8fea79d24',
    domain: domains[3]._id,
    street: streets[3]._id,
    companyName: 'company_3',
    adminEmails: [users.globalAdmin.email],
    pricePerMeter: 10,
    servicePricePerMeter: 10,
    description: 'none',
    totalArea: 10,
    garbageCollector: 14,
    waterPart: 0,
    rentPart: 0,
    inflicion: false,
  },
  {
    _id: '64d68421d9ba2fc8fea79d25',
    domain: domains[4]._id,
    street: streets[4]._id,
    companyName: 'company_4',
    description: 'none',
    adminEmails: [users.user.email],
    pricePerMeter: 10,
    servicePricePerMeter: 10,
    totalArea: 10,
    garbageCollector: 13,
    waterPart: 0,
    rentPart: 0,
    inflicion: false,
  },
]

/*
 * Test services Dates:
 * 12.01.2020
 * 19.06.2020
 * 11.10.2020
 * 17.04.2021
 * 15.05.2021
 * 10.08.2021
 * 02.01.2022
 * 13.03.2022
 * 07.05.2023
 * 01.07.2023
 * 02.10.2023
 */
export const services = [
  {
    _id: '64d68421d9ba2fc8fea79d51',
    date: new Date(2020, 1, 12),
    domain: domains[0]._id,
    street: streets[0]._id,
    rentPrice: 10,
    electricityPrice: 10,
    waterPrice: 10,
    inflicionPrice: 1.1,
    description: 'none',
  },
  {
    _id: '64d68421d9ba2fc8fea79d52',
    date: new Date(2020, 6, 19),
    domain: domains[1]._id,
    street: streets[1]._id,
    rentPrice: 20,
    electricityPrice: 20,
    waterPrice: 20,
    inflicionPrice: 1.2,
    description: 'none',
  },
  {
    _id: '64d68421d9ba2fc8fea79d53',
    date: new Date(2020, 10, 11),
    domain: domains[0]._id,
    street: streets[1]._id,
    rentPrice: 30,
    electricityPrice: 30,
    waterPrice: 30,
    inflicionPrice: 1.3,
    description: 'none',
  },
  {
    _id: '64d68421d9ba2fc8fea79d54',
    date: new Date(2021, 4, 17),
    domain: domains[0]._id,
    street: streets[2]._id,
    rentPrice: 30,
    electricityPrice: 30,
    waterPrice: 30,
    inflicionPrice: 1.3,
    description: 'none',
  },
  {
    _id: '64d68421d9ba2fc8fea79d55',
    date: new Date(2021, 5, 15),
    domain: domains[1]._id,
    street: streets[2]._id,
    rentPrice: 30,
    electricityPrice: 30,
    waterPrice: 30,
    inflicionPrice: 1.3,
    description: 'none',
  },
  {
    _id: '64d68421d9ba2fc8fea79d56',
    date: new Date(2021, 8, 10),
    domain: domains[2]._id,
    street: streets[2]._id,
    rentPrice: 30,
    electricityPrice: 30,
    waterPrice: 30,
    inflicionPrice: 1.3,
    description: 'none',
  },
]

/*
 * Test payments Dates:
 * 11.01.2020
 * 18.06.2020
 * 10.10.2020
 * 16.04.2021
 * 14.05.2021
 * 09.08.2021
 * 01.01.2022
 * 12.03.2022
 * 06.05.2023
 * 31.06.2023
 * 01.10.2023
 */
export const payments = [
  {
    _id: '64d68421d9ba2fc8fea79d61',
    invoiceNumber: 3,
    type: 'debit',
    date: new Date(2020, 10, 10),
    domain: domains[2]._id,
    street: streets[2]._id,
    company: realEstates[2]._id,
    monthService: services[2]._id,
    description: 'none',
    invoice: [
      {
        type: 'maintenancePrice',
        amount: 10,
        price: 10,
        sum: 100,
      },
      {
        type: 'placingPrice',
        amount: 10,
        price: 20,
        sum: 200,
      },
      {
        type: 'electricityPrice',
        amount: 10,
        price: 30,
        sum: 300,
      },
      {
        type: 'waterPrice',
        amount: 10,
        price: 40,
        sum: 400,
      },
    ],
    services: [],
    // provider: {
    //   description: 'provider_3',
    // },
    // receiver: {
    //   companyName: 'receiver_3',
    //   adminEmails: [],
    //   description: '+3801234567893',
    // },
    generalSum: 1000,
  },
  {
    _id: '64d68421d9ba2fc8fea79d62',
    invoiceNumber: 2,
    type: 'debit',
    date: new Date(2020, 6, 18),
    domain: domains[1]._id,
    street: streets[1]._id,
    company: realEstates[1]._id,
    monthService: services[1]._id,
    description: 'none',
    invoice: [
      {
        type: 'maintenancePrice',
        amount: 10,
        price: 10,
        sum: 100,
      },
      {
        type: 'placingPrice',
        amount: 10,
        price: 20,
        sum: 200,
      },
      {
        type: 'electricityPrice',
        amount: 10,
        price: 30,
        sum: 300,
      },
      {
        type: 'waterPrice',
        amount: 10,
        price: 40,
        sum: 400,
      },
    ],
    services: [],
    // provider: {
    //   description: 'provider_3',
    // },
    // receiver: {
    //   companyName: 'receiver_3',
    //   adminEmails: [],
    //   description: '+3801234567893',
    // },
    generalSum: 1000,
  },
  {
    _id: '64d68421d9ba2fc8fea79d63',
    invoiceNumber: 1,
    type: 'debit',
    date: new Date(2020, 1, 11),
    domain: domains[0]._id,
    street: streets[0]._id,
    company: realEstates[0]._id,
    monthService: services[0]._id,
    description: 'none',
    invoice: [
      {
        type: 'maintenancePrice',
        amount: 10,
        price: 10,
        sum: 100,
      },
      {
        type: 'placingPrice',
        amount: 10,
        price: 20,
        sum: 200,
      },
      {
        type: 'electricityPrice',
        amount: 10,
        price: 30,
        sum: 300,
      },
      {
        type: 'waterPrice',
        amount: 10,
        price: 40,
        sum: 400,
      },
    ],
    services: [],
    // provider: {
    //   description: 'provider_3',
    // },
    // receiver: {
    //   companyName: 'receiver_3',
    //   adminEmails: [],
    //   description: '+3801234567893',
    // },
    generalSum: 1000,
  },
]
