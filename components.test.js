//   const asyncMock = jest.fn().mockResolvedValue({
//     data: [
//       {
//         _id: '62f65894565c08c3cd93be6a',
//         description: '123',
//         name: 'Трупопровідники',
//         taskincategory: [],
//       },
//     ],
//   })
//   console.log(asyncMock)

//   const _id = asyncMock?.data[0]?.id
//   expect(id).toBe('62f65894565c08c3cd93be6a')
// })
const getAllCategories = require('../categoriesApi/category.api')
const axios = require('axios')

jest.mock('axios')

// it('Get request', async () => {
//   axios.get('http://localhost:3000/api/categories')({
//     data: [
//       {
//         _id: '62f65894565c08c3cd93be6a',
//         description: '123',
//         name: 'Трупопровідники',
//         taskincategory: [],
//       },
//     ],
//   })

it('Get request', async () => {
  axios.post('http://localhost:3000/api/categories', {
    data: [
      {
        _id: '62f65894565c08c3cd93be6a',
        description: '123',
        name: 'Трупопровідники',
        taskincategory: [],
      },
    ],
  })

  const description = await getAllCategories()
  expect(description).toEqual('123')
})

// })
