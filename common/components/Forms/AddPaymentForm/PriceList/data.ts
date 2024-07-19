// export const data = [
//   {
//     key: '1',
//     number: '1',
//     description: 'Оренда приміщення',
//     quantity: 1,
//     unit: 'грн.',
//     price: '3420.00',
//     total: '3420.00',
//   },
//   {
//     key: '2',
//     number: '2',
//     description: 'Послуги Інтернет за місяць',
//     quantity: 1,
//     unit: 'грн.',
//     price: '250.00',
//     total: '250.00',
//   },
//   {
//     key: '3',
//     number: '3',
//     description: 'Електроенергія',
//     quantity: 1,
//     unit: 'грн.',
//     price: '864.00',
//     total: '864.00',
//   },
//   {
//     key: '4',
//     number: '4',
//     description: 'Опалення',
//     quantity: 1,
//     unit: 'грн.',
//     price: '2064.00',
//     total: '2064.00',
//   },
//   {
//     key: '5',
//     number: '',
//     description: '',
//     quantity: '',
//     unit: '',
//     price: '',
//     total: '',
//   },
//   {
//     key: '6',
//     number: '',
//     description: 'Всього:',
//     quantity: '',
//     unit: '',
//     price: '',
//     total: '6598.00',
//   },
// ];


import {IDomain} from "@common/modules/models/Domain";
import {IStreet} from "@common/modules/models/Street";
import {IRealestate} from "@common/api/realestateApi/realestate.api.types";
import {IService} from "@common/api/serviceApi/service.api.types";

export const data = [{
  invoiceNumber: 165,
  type: "debit",
  invoiceCreationDate: new Date("2024-03-27T19:05:36.914Z"),
  domain:  "64e52ba0f34ff57a2ca5509f",
  street: "64e52b61f34ff57a2ca55078",
  company: "64e7d358ee781467734b6be7",
  monthService: "66046998f69357e2cab3359c",
  description: "",
  invoice: [
    {
      type: "maintenancePrice",
      amount: 75,
      price: 25,
      sum: 1875
    },
    {
      type: "placingPrice",
      price: "11250.0",
      sum: "11250.0"
    },
    {
      type: "inflicionPrice",
      price: 0,
      sum: "0.0"
    },
    {
      type: "electricityPrice",
      lastAmount: "0.00",
      amount: 1,
      price: 11,
      sum: 11
    },
    {
      type: "waterPart",
      price: "88.88",
      sum: "88.9"
    },
    {
      type: "garbageCollectorPrice",
      price: "61.6",
      sum: "61.6"
    },
    {
      type: "cleaningPrice",
      price: 200,
      sum: "200.0"
    },
    {
      type: "discount",
      price: -3333,
      sum: "-3333.0"
    }
  ],
  provider: {
    description: "mykola.ext@element.in\n1\nmykola.ext@element.in\n(edited)\n"
  },
  reciever: {
    companyName: "cowork",
    adminEmails: [
      "vipslord@gmail.com",
      "mykola@consideritdone.tech"
    ],
    description: "cowork\ncowork\ncowork\n"
  },
  generalSum: 10153.5,
}
]
