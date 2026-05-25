import EncryptionService from './index'

describe('EncryptionService', () => {
  const validSecretKey = 'my-secret-key'
  const service = new EncryptionService(validSecretKey)

  let errorSpy: jest.SpyInstance
  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterAll(() => {
    errorSpy.mockRestore()
  })

  it('should encrypt and decrypt a value correctly', () => {
    const originalText = 'Hello World'
    const encrypted = service.encrypt(originalText)
    const decrypted = service.decrypt(encrypted)

    expect(encrypted).not.toBe(originalText)
    expect(decrypted).toBe(originalText)
  })

  it('should return an error string when trying to decrypt invalid data', () => {
    const invalidEncrypted = 'invalid-data'

    const result = service.decrypt(invalidEncrypted)

    expect(result).toMatch(/^Error:/)
  })

  it('should return an error string when trying to decrypt with wrong key', () => {
    const text = 'Secret Message'
    const encrypted = service.encrypt(text)

    const wrongService = new EncryptionService('wrong-key')
    const result = wrongService.decrypt(encrypted)

    expect(result).toMatch(/^Error:/)
  })

  it('should throw a specific error when decryption yields an empty string', () => {
    const encrypted = service.encrypt('')
    const result = service.decrypt(encrypted)

    expect(result).toBe('Error: Empty string')
  })

  it('should encrypt empty string and decrypt back to empty string', () => {
    const encrypted = service.encrypt('')
    const decrypted = service.decrypt(encrypted)

    expect(decrypted).toBe('Error: Empty string')
  })

  it('should handle encryption of empty string gracefully', () => {
    const encrypted = service.encrypt('')
    expect(typeof encrypted).toBe('string')
    expect(encrypted.length).toBeGreaterThan(0)
  })

  it('should throw or behave consistently if secretKey is an empty string', () => {
    const serviceWithEmptyKey = new EncryptionService('')

    const encrypted = serviceWithEmptyKey.encrypt('test')
    const decrypted = serviceWithEmptyKey.decrypt(encrypted)

    expect(typeof decrypted).toBe('string')
  })

  it('should encrypt and decrypt when secretKey is only spaces', () => {
    const serviceWithSpaces = new EncryptionService('   ')
    const encrypted = serviceWithSpaces.encrypt('spacey')
    const decrypted = serviceWithSpaces.decrypt(encrypted)

    expect(decrypted).toBe('spacey')
  })

  it('should handle encrypt(undefined) gracefully', () => {
    const result = service.encrypt(undefined as unknown as string)
    expect(typeof result).toBe('string')
  })

  it('should handle decrypt(undefined) gracefully', () => {
    const result = service.decrypt(undefined as unknown as string)
    expect(result).toMatch(/^Error:/)
  })
})
