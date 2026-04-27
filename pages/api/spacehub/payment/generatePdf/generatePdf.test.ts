import handler from '@pages/api/spacehub/payment/generatePdf/index'
import { generatePdf, generateZip } from '@utils/pdf/bufferGenerators'

jest.mock('@utils/pdf/bufferGenerators')

const mockGeneratePdf = generatePdf as jest.Mock
const mockGenerateZip = generateZip as jest.Mock

const createMocks = (method: string, body: any = {}) => {
  const req = { method, body } as any
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  } as any
  return { req, res }
}

const createPayment = (overrides = {}) => ({
  _id: '1',
  invoiceNumber: '123',
  reciever: { companyName: 'TestCompany' },
  ...overrides,
})

describe('generatePdf API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return pdf for single payment', async () => {
    mockGeneratePdf.mockResolvedValue(Buffer.from('pdf'))

    const { req, res } = createMocks('POST', {
      payments: [createPayment()],
    })

    await handler(req, res)

    expect(res.json).toHaveBeenCalled()
    const data = res.json.mock.calls[0][0]

    expect(data.fileExtension).toBe('pdf')
    expect(mockGeneratePdf).toHaveBeenCalledTimes(1)
  })

  it('should return zip for multiple payments', async () => {
    mockGenerateZip.mockResolvedValue(Buffer.from('zip'))

    const { req, res } = createMocks('POST', {
      payments: [createPayment(), createPayment()],
    })

    await handler(req, res)

    const data = res.json.mock.calls[0][0]

    expect(data.fileExtension).toBe('zip')
    expect(mockGenerateZip).toHaveBeenCalledTimes(1)
  })

  it('should return 500 for empty payments', async () => {
    const { req, res } = createMocks('POST', {
      payments: [],
    })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('should return 500 if payments is missing', async () => {
    const { req, res } = createMocks('POST', {})

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('should return 500 if payments is null', async () => {
    const { req, res } = createMocks('POST', {
      payments: null,
    })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('should handle generatePdf error', async () => {
    mockGeneratePdf.mockRejectedValue(new Error('pdf error'))

    const { req, res } = createMocks('POST', {
      payments: [createPayment()],
    })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('should handle generateZip error', async () => {
    mockGenerateZip.mockRejectedValue(new Error('zip error'))

    const { req, res } = createMocks('POST', {
      payments: [createPayment(), createPayment()],
    })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('should set correct headers for pdf', async () => {
    mockGeneratePdf.mockResolvedValue(Buffer.from('pdf'))

    const { req, res } = createMocks('POST', {
      payments: [createPayment()],
    })

    await handler(req, res)

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf'
    )
  })

  it('should set correct headers for zip', async () => {
    mockGenerateZip.mockResolvedValue(Buffer.from('zip'))

    const { req, res } = createMocks('POST', {
      payments: [createPayment(), createPayment()],
    })

    await handler(req, res)

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/zip'
    )
  })

  it('should call generatePdf for single payment', async () => {
    mockGeneratePdf.mockResolvedValue(Buffer.from('pdf'))

    const { req, res } = createMocks('POST', {
      payments: [createPayment()],
    })

    await handler(req, res)

    expect(mockGeneratePdf).toHaveBeenCalledTimes(1)
    expect(mockGenerateZip).not.toHaveBeenCalled()
  })

  it('should call generateZip for multiple payments', async () => {
    
    const { req, res } = createMocks('POST', {
      payments: [createPayment(), createPayment()],
    })

    await handler(req, res)

    expect(mockGenerateZip).toHaveBeenCalledTimes(1)
    expect(mockGeneratePdf).not.toHaveBeenCalled()
  })
})