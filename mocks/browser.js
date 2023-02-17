import { rest } from 'msw'
import { setupWorker } from 'msw/node'
const worker = setupWorker(
  rest.post('/api/categories/', async (req, res, ctx) => {
    const { data } = await req.json()
    return res(
      ctx.json({
        id: 8,
        success: true,
        description: 'dchdd',
        name: 'bfebvhhfev',
        taskincategory: [],
        __v: 0,
        _id: '62e98566facdec6630f608',
      })
    )
  })
)
worker.start()
