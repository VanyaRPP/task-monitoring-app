interface IOrder {
  id: number
  task: string
  master: string
  date: string
  status: string
}

export const orders: IOrder[] = [
  {
    id: 0,
    task: 'Fix the window',
    master: 'John Doe',
    date: '1994-12-17T03:24:00',
    status: 'Done',
  },
  {
    id: 1,
    task: 'Fix the door',
    master: 'Joe Rogan',
    date: '2022-12-17T03:24:00',
    status: 'Pending',
  },
  {
    id: 2,
    task: 'Fix the sink',
    master: 'Elon Musk',
    date: '2002-01-13T03:24:00',
    status: 'Pending',
  },
]

interface IMaster {
  id: number
  about: {
    name: string
    avatar?: any
    description: string
  }
  rate: number
  specials: string[]
}

export const masters: IMaster[] = [
  {
    id: 0,
    about: {
      name: 'John Doe',
      avatar: null,
      description:
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Debitis, quisquam?',
    },
    rate: 4,
    specials: ['Plomber'],
  },
  {
    id: 1,
    about: {
      name: 'Elon Muske',
      avatar: null,
      description: 'Tesla and SpaceX',
    },
    rate: 3,
    specials: ['Elektrick', 'Businessman', 'Playboy'],
  },
  {
    id: 2,
    about: {
      name: 'Joe Rogan',
      avatar: null,
      description: 'Really tallanted',
    },
    rate: 5,
    specials: ['Actor'],
  },
]

interface IDomain {
  id: number
  name: string
  rate: number
  address: string
}

export const domains: IDomain[] = [
  {
    id: 0,
    name: 'Domain #1',
    rate: 4,
    address: 'Zhytomyr city, Mala Berdychivska street, 17',
  },
  {
    id: 1,
    name: 'Domain #2',
    rate: 4.5,
    address: 'Zhytomyr city, Mala Berdychivska street, 15',
  },
]
