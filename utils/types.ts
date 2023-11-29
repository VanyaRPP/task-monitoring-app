export type PaymentOptions = {
  searchEmail?: string | string[]
  userEmail: string
}

export type InputItem = {
  companyName: string
  totalArea: number
}

export type OutputData = {
  companyNames: string[]
  totalAreas: number[]
  totalArea: number
  areasPercentage: number[]
}
