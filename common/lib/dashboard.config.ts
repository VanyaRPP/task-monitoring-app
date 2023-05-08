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
