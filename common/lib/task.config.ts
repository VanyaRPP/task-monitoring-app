interface ITaskConfig {
  auction: {
    data: {
      id: number
      name: string
      special?: string
      avatar?: any
      price: number
      rating: number
    }[]
    columns: {
      title: string
      dataIndex: string
      key: string
      width?: number
      sorter?: any
    }[]
  }
  comments: {
    data: {
      id: number
      name?: string
      comment?: string
      avatar?: any
    }[]
  }
  feedbacks: {
    data: {
      id: number
      name: string
      feedback: string
      avatar?: any
      rate: number
    }[]
  }
}

const config: ITaskConfig = {
  auction: {
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
  },
  comments: {
    data: [
      {
        id: 0,
        name: 'Vova',
        comment: 'Hello, World!',
        avatar: null,
      },
      {
        id: 1,
        name: 'Dima',
        comment: 'Random comment',
        avatar: null,
      },
      {
        id: 2,
        name: 'Sasha',
        comment:
          'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aspernatur exercitationem culpa et voluptate animi velit, quibusdam doloribus magni laborum dolor iure quam id facilis rerum corrupti? Laudantium deleniti dicta at.',
        avatar: null,
      },
      {
        id: 3,
        name: 'Anya',
        comment: 'Waka waka',
        avatar: null,
      },
    ],
  },
  feedbacks: {
    data: [
      {
        id: 0,
        name: 'Vasia',
        feedback: 'So amazing!',
        avatar: null,
        rate: 5,
      },
      {
        id: 1,
        name: 'Dasha',
        feedback: 'So bad!',
        avatar: null,
        rate: 2,
      },
    ],
  },
}

export default config
