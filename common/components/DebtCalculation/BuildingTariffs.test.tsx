import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DebtCalculationContext, IDebtCalculationContext } from './'
import BuildingTariffs from './BuildingTariffs'

const readPdf = jest.fn()
const saveTariffs = jest.fn()

jest.mock('@common/api/debtCalculationApi/debtCalculation.api', () => ({
  useReadTariffsPdfMutation: () => [readPdf, { isLoading: false }],
  useSaveBuildingTariffsMutation: () => [saveTariffs, { isLoading: false }],
}))

const STREET = { _id: 'st-1', address: 'вул. Тестова, 7', city: 'Київ' }
const COMPANY = {
  _id: 'apt-18',
  companyName: 'Квартира №18',
  street: STREET,
} as unknown as IExtendedRealestate

const READ = {
  hasText: true,
  street: 'st-1',
  tariffs: {
    address: 'вул. Тестова, 7',
    groups: [
      { label: 'І поверх', apartments: '1-3; 31-33' },
      { label: 'вище І поверху', apartments: '' },
    ],
    periods: [
      { from: '2018-06-10', to: '2019-06-10', tariffs: [4.1, 5.2] },
      { from: '2019-06-11', tariffs: [4.1, 6] },
    ],
  },
  warnings: [
    'Рядок 3 (з 01.12.2021): квартири «1-3; 31-3» замість «1-3; 31-33»',
  ],
}

const renderTariffs = () =>
  render(
    <DebtCalculationContext.Provider
      value={
        {
          domainId: 'domain-1',
          companies: [COMPANY],
          company: COMPANY,
          buildingTariffs: [],
          tariffGroup: undefined,
          overrides: {},
          setApartmentOverride: jest.fn(),
        } as unknown as IDebtCalculationContext
      }
    >
      <BuildingTariffs />
    </DebtCalculationContext.Provider>
  )

const pdf = () =>
  new File(['%PDF-1.4'], 'Тарифи.pdf', { type: 'application/pdf' })

describe('«Тарифи» of the buildings', () => {
  beforeEach(() => {
    readPdf.mockReset()
    saveTariffs.mockReset()
    readPdf.mockReturnValue({ unwrap: async () => READ })
    saveTariffs.mockReturnValue({ unwrap: async () => [] })
  })

  it('reads a PDF into the table, warns, and saves it for the building', async () => {
    renderTariffs()
    await userEvent.click(screen.getByText('Тарифи'))
    expect(await screen.findByText(/Тарифів ще немає/)).toBeInTheDocument()

    await userEvent.upload(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      pdf()
    )

    // Sent as a data URL for the provider being calculated.
    await waitFor(() => expect(readPdf).toHaveBeenCalled())
    expect(readPdf.mock.calls[0][0]).toMatchObject({
      domainId: 'domain-1',
      file: expect.stringMatching(/^data:application\/pdf;base64,/),
    })

    // Both periods, a tariff per group, and what to check.
    const tariffs = await screen.findAllByLabelText('Тариф, вище І поверху')
    expect(tariffs.map((input) => (input as HTMLInputElement).value)).toEqual([
      '5.20',
      '6.00',
    ])
    expect(screen.getByText(/квартири «1-3; 31-3»/)).toBeInTheDocument()

    await userEvent.click(screen.getByText('Зберегти'))

    await waitFor(() => expect(saveTariffs).toHaveBeenCalled())
    expect(saveTariffs.mock.calls[0][0]).toEqual({
      domainId: 'domain-1',
      tariffs: { ...READ.tariffs, street: 'st-1' },
    })
  })

  it('shows the company’s group when the building has several', async () => {
    renderTariffs()
    await userEvent.click(screen.getByText('Тарифи'))
    await userEvent.upload(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      pdf()
    )

    expect(
      await screen.findByText(/Квартира №18 \(кв\. 18\) платить за/)
    ).toBeInTheDocument()
  })
})
