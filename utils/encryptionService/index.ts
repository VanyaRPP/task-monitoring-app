import CryptoJS from 'crypto-js'

class EncryptionService {
  private secretKey: string

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  /**
   * Encrypts a given value using the instance's secret key.
   * @param value - The value to encrypt.
   * @returns The encrypted value as a string.
   */
  encrypt(value: string): string {
    return CryptoJS.AES.encrypt(value, this.secretKey).toString()
  }

  /**
   * Decrypts a given encrypted value using the instance's secret key.
   * @param encryptedValue - The value to decrypt.
   * @returns The decrypted value as a string.
   */
  decrypt(encryptedValue: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedValue, this.secretKey)
    return bytes.toString(CryptoJS.enc.Utf8)
  }
}

export default EncryptionService
