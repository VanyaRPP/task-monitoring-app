const config = {
  data: [
    {
      id: 0,
      name: 'Sasha',
      special: 'Plomber',
      avatar: null,
      price: 20,
      rating: 4.2,
    },
    {
      id: 1,
      name: 'Dima',
      special: 'Elektrik',
      avatar: null,
      price: 32,
      rating: 0,
    },
    {
      id: 2,
      name: 'Vova',
      special: 'Programmer',
      avatar: null,
      price: 12,
      rating: 4.2,
    },
    {
      id: 3,
      name: 'Vasia',
      special: 'Builder',
      avatar: null,
      price: 100,
      rating: 3.1,
    },
  ],

  columns: [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 50,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: 50,
      sorter: (a, b) => a.rating - b.rating,
    },
  ],
}

export default config
