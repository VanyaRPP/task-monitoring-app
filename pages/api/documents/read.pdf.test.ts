import handler from './read'
import { getCurrentUser } from '@utils/getCurrentUser'
import { readPdfDocument } from '@common/services/aiAssistant/documents'

jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@utils/getCurrentUser', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@common/services/aiAssistant/documents', () => ({
  ...jest.requireActual('@common/services/aiAssistant/documents/index'),
  readPdfDocument: jest.fn(),
}))
// The real readers pull in the vision providers; only the PDF step runs here.
jest.mock('@common/services/aiAssistant/documents/extract', () => ({}))
jest.mock('@common/services/aiAssistant/documents/matchCompany', () => ({}))

const mockUser = getCurrentUser as jest.Mock
const mockRead = readPdfDocument as jest.Mock

const admin = {
  isAdmin: true,
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: 'admin@example.com' },
}

const call = async (body: Record<string, unknown>) => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  res.setHeader = jest.fn()
  await handler({ method: 'POST', body } as any, res)
  return res
}

const PDF = `data:application/pdf;base64,${Buffer.from('%PDF-1.4').toString('base64')}`

describe('POST /api/documents/read, step pdf', () => {
  beforeEach(() => jest.clearAllMocks())

  it('is for admins only', async () => {
    mockUser.mockResolvedValue({ ...admin, isAdmin: false })
    const res = await call({ step: 'pdf', file: PDF })

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mockRead).not.toHaveBeenCalled()
  })

  it('wants a PDF, not an image or nothing', async () => {
    mockUser.mockResolvedValue(admin)
    const res = await call({ step: 'pdf', file: 'data:image/png;base64,AAAA' })

    expect(res.status).toHaveBeenCalledWith(400)
    expect(mockRead).not.toHaveBeenCalled()
  })

  it('reads the file for the signed-in user', async () => {
    mockUser.mockResolvedValue(admin)
    mockRead.mockResolvedValue({ documentType: 'debtMonthlyStatement' })

    const res = await call({ step: 'pdf', file: PDF })

    expect(res.status).toHaveBeenCalledWith(200)
    const [bytes, ctx] = mockRead.mock.calls[0]
    expect(Buffer.from(bytes).toString()).toBe('%PDF-1.4')
    expect(ctx.user.email).toBe('admin@example.com')
  })

  it('says so when the file cannot be opened', async () => {
    mockUser.mockResolvedValue(admin)
    mockRead.mockRejectedValue(new Error('Invalid PDF structure'))
    jest.spyOn(console, 'error').mockImplementationOnce(() => undefined)

    const res = await call({ step: 'pdf', file: PDF })

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Не вдалося відкрити PDF',
    })
  })
})
