const config = {
  myOrders: [
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
      date: '1993-14-15T03:24:00',
      status: 'Pending',
    },
    {
      id: 2,
      task: 'Fix the sink',
      master: 'Elon Musk',
      date: '2002-01-13T03:24:00',
      status: 'Pending',
    },
  ],

  mastersList: [
    {
      id: 0,
      name: 'John Doe',
      avatar: null,
      rate: 4,
      special: 'Plomber',
    },
    {
      id: 1,
      name: 'Elon Muske',
      avatar: null,
      rate: 3,
      special: 'Plomber',
    },
    {
      id: 1,
      name: 'Joe Rogan',
      avatar: null,
      rate: 5,
      special: 'Plomber',
    },
  ],

  domainLists: [
    {
      id: 0,
      name: 'Domain #1',
      rate: 4,
      address: 'Zhytomyr city, Mala Berdychivska street, 17',
    },
    {
      id: 1,
      name: 'Domain #2',
      rate: 4,
      address: 'Zhytomyr city, Mala Berdychivska street, 15',
    },
  ],
}

export default config
