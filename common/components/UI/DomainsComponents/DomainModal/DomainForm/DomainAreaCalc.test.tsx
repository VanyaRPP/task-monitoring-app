import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AreaCalculationCard from './DomainAreaCalc'
import { useGetAreasQuery } from '@common/api/domainApi/domain.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { Form, message } from 'antd'

jest.mock('@common/api/domainApi/domain.api')
jest.mock('@common/api/realestateApi/realestate.api')

jest.mock('@components/Chart', () => {
  const MockChart = ({ dataSources }: any) => (
    <div data-testid="mock-chart" data-sources={JSON.stringify(dataSources)} />
  )
  MockChart.displayName = 'MockChart'
  return MockChart
})

jest.mock('antd', () => {
  const originalModule = jest.requireActual('antd')
  return {
    ...originalModule,
    Form: {
      ...originalModule.Form,
      useWatch: jest.fn(),
    },
  }
})

describe('AreaCalculationCard Component', () => {
  let formState: Record<string, any> = {}

  const mockForm = {
    getFieldValue: jest.fn((name: string) => formState[name]),
    setFieldValue: jest.fn((name: string, value: any) => {
      formState[name] = value
    }),
    setFieldsValue: jest.fn((values: Record<string, any>) => {
      formState = { ...formState, ...values }
    }),
  }

  const mockRefetch = jest.fn()

  const mockAreasData = {
    companies: [
      { companyName: 'Company A', totalArea: 10, rentPart: 50 },
      { companyName: 'Company B', totalArea: 10, rentPart: 50 },
    ],
  }

  const mockAllRealEstate = {
    data: [
      { companyName: 'Company A', _id: 'id-1', totalArea: 30 },
      { companyName: 'Company B', _id: 'id-2', totalArea: 10 },
    ],
  }

  const renderCard = (props: Partial<{ editable: boolean }> = {}) =>
    render(
      <AreaCalculationCard
        domainId="123"
        editable={props.editable ?? true}
        form={mockForm}
      />
    )

  const getChartDataSources = () =>
    JSON.parse(screen.getByTestId('mock-chart').getAttribute('data-sources'))

  beforeEach(() => {
    jest.clearAllMocks()
    formState = {
      showAreaDetails: true,
      companiesAreas: mockAreasData.companies.map((c, i) => ({
        _id: `id-${i + 1}`,
        name: c.companyName,
        area: c.totalArea,
        rentPart: c.rentPart,
        key: `id-${i + 1}`,
        _initialArea: c.totalArea,
        _initialRentPart: c.rentPart,
      })),
    }
    ;(useGetAreasQuery as jest.Mock).mockReturnValue({
      data: mockAreasData,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    })
    ;(useGetAllRealEstateQuery as jest.Mock).mockReturnValue({
      data: mockAllRealEstate,
    })
    ;(Form.useWatch as jest.Mock).mockImplementation(
      (name: string) => formState[name] ?? null
    )
  })

  test('Renders a table with data on load', async () => {
    renderCard()

    expect(screen.getByText('Company A')).toBeInTheDocument()
    expect(screen.getByText('Company B')).toBeInTheDocument()

    expect(screen.getByText('20.00 м²')).toBeInTheDocument()
  })

  test('Asks only for the real estate of this domain', () => {
    renderCard()

    expect(useGetAllRealEstateQuery).toHaveBeenCalledWith(
      { domainId: '123' },
      expect.objectContaining({ skip: false })
    )
  })

  test('Calls form.setFieldsValue on data initialization', async () => {
    renderCard()

    await waitFor(() => {
      expect(mockForm.setFieldsValue).toHaveBeenCalledWith({
        companiesAreas: expect.any(Array),
      })
    })
  })

  test('Calls refetch when clicking the reload button', () => {
    renderCard()

    const reloadButton = screen.getByTestId('reload-button')
    fireEvent.click(reloadButton)

    expect(mockForm.setFieldValue).toHaveBeenCalledWith('companiesAreas', [])
    expect(mockRefetch).toHaveBeenCalled()
  })

  test('Reload drops the local changes and reseeds from the API', async () => {
    const { rerender } = renderCard()

    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '15' } })
    expect(formState.companiesAreas[0].area).toBe(15)

    fireEvent.click(screen.getByTestId('reload-button'))
    expect(formState.companiesAreas).toEqual([])

    ;(useGetAreasQuery as jest.Mock).mockReturnValue({
      data: { ...mockAreasData },
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    })
    rerender(
      <AreaCalculationCard domainId="123" editable={true} form={mockForm} />
    )

    await waitFor(() => {
      expect(formState.companiesAreas).toHaveLength(2)
    })
    expect(formState.companiesAreas[0]).toMatchObject({
      area: 10,
      rentPart: 50,
    })
  })

  test('Updates form values locally on InputNumber change', () => {
    renderCard()

    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '15' } })

    expect(mockForm.setFieldValue).toHaveBeenCalledWith(
      'companiesAreas',
      expect.arrayContaining([expect.objectContaining({ area: 15 })])
    )
  })

  test('Editing an area does not move the shares on its own', () => {
    const { rerender } = renderCard()

    fireEvent.change(screen.getAllByRole('spinbutton')[0], {
      target: { value: '90' },
    })

    expect(formState.companiesAreas.map((c: any) => c.rentPart)).toEqual([
      50, 50,
    ])

    rerender(
      <AreaCalculationCard domainId="123" editable={true} form={mockForm} />
    )

    expect(screen.getAllByText('50.00 %')).toHaveLength(2)
    expect(screen.getByText('100.00 м²')).toBeInTheDocument()
  })

  test('Typing in an area input leaves the chart where it is', () => {
    const { rerender } = renderCard()

    const before = screen.getByTestId('mock-chart').getAttribute('data-sources')

    fireEvent.change(screen.getAllByRole('spinbutton')[0], {
      target: { value: '90' },
    })
    rerender(
      <AreaCalculationCard domainId="123" editable={true} form={mockForm} />
    )

    expect(screen.getByTestId('mock-chart').getAttribute('data-sources')).toBe(
      before
    )

    fireEvent.click(screen.getByTestId('recalculate-button'))
    rerender(
      <AreaCalculationCard domainId="123" editable={true} form={mockForm} />
    )
    expect(
      screen.getByTestId('mock-chart').getAttribute('data-sources')
    ).not.toBe(before)
  })

  test('Recalculation pulls the actual company areas and rewrites the shares', () => {
    renderCard()

    fireEvent.click(screen.getByTestId('recalculate-button'))

    expect(mockForm.setFieldValue).toHaveBeenCalledWith(
      'companiesAreas',
      expect.any(Array)
    )
    expect(formState.companiesAreas).toEqual([
      expect.objectContaining({ name: 'Company A', area: 30, rentPart: 75 }),
      expect.objectContaining({ name: 'Company B', area: 10, rentPart: 25 }),
    ])
  })

  test('Recalculation refreshes the table, the summary and the chart', () => {
    const { rerender } = renderCard()

    fireEvent.click(screen.getByTestId('recalculate-button'))
    rerender(
      <AreaCalculationCard domainId="123" editable={true} form={mockForm} />
    )

    expect(screen.getByText('75.00 %')).toBeInTheDocument()
    expect(screen.getByText('25.00 %')).toBeInTheDocument()
    expect(screen.getByText('40.00 м²')).toBeInTheDocument()
    expect(screen.getByText('100.00%')).toBeInTheDocument()
    expect(getChartDataSources()).toEqual([
      { label: 'Company A', value: { part: 75, area: 30 } },
      { label: 'Company B', value: { part: 25, area: 10 } },
    ])
  })

  test('Recalculation takes a change of a single company area into account', () => {
    ;(useGetAllRealEstateQuery as jest.Mock).mockReturnValue({
      data: {
        data: [
          { companyName: 'Company A', _id: 'id-1', totalArea: 10 },
          { companyName: 'Company B', _id: 'id-2', totalArea: 10 },
        ],
      },
    })
    const { unmount } = renderCard()

    fireEvent.click(screen.getByTestId('recalculate-button'))
    expect(formState.companiesAreas.map((c: any) => c.rentPart)).toEqual([
      50, 50,
    ])
    unmount()

    // Company B's area changed in the companies' data.
    ;(useGetAllRealEstateQuery as jest.Mock).mockReturnValue({
      data: {
        data: [
          { companyName: 'Company A', _id: 'id-1', totalArea: 10 },
          { companyName: 'Company B', _id: 'id-2', totalArea: 30 },
        ],
      },
    })
    renderCard()

    fireEvent.click(screen.getByTestId('recalculate-button'))
    expect(formState.companiesAreas.map((c: any) => c.rentPart)).toEqual([
      25, 75,
    ])
  })

  test('Recalculation reports back to the user', () => {
    const successSpy = jest.spyOn(message, 'success')
    renderCard()

    fireEvent.click(screen.getByTestId('recalculate-button'))

    expect(successSpy).toHaveBeenCalledWith(
      expect.stringContaining('Частки перераховано за актуальними даними')
    )
    expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('40.00 м²'))
  })

  test('Recalculation marks the form as changed, reload resets the flag', () => {
    const setIsValueChanged = jest.fn()
    render(
      <AreaCalculationCard
        domainId="123"
        editable={true}
        form={mockForm}
        setIsValueChanged={setIsValueChanged}
      />
    )

    fireEvent.click(screen.getByTestId('recalculate-button'))
    expect(setIsValueChanged).toHaveBeenCalledWith(true)

    fireEvent.click(screen.getByTestId('reload-button'))
    expect(setIsValueChanged).toHaveBeenLastCalledWith(false)
  })

  test('Recalculation is not offered in preview mode', () => {
    renderCard({ editable: false })

    expect(screen.getByTestId('recalculate-button')).toBeDisabled()
    expect(screen.getByTestId('reload-button')).not.toBeDisabled()
  })

  test('The share column stays read only', () => {
    renderCard()

    expect(screen.getAllByRole('spinbutton')).toHaveLength(2)
  })

  describe('Per company states', () => {
    // A 10 m², B 10 m², C 20 m² — 25% / 25% / 50% of 40 m².
    const companies = [
      { companyName: 'Company A', totalArea: 10, rentPart: 25 },
      { companyName: 'Company B', totalArea: 10, rentPart: 25 },
      { companyName: 'Company C', totalArea: 20, rentPart: 50 },
    ]

    const rerenderCard = (rerender: any) =>
      rerender(
        <AreaCalculationCard domainId="123" editable={true} form={mockForm} />
      )

    const areas = () => formState.companiesAreas.map((c: any) => c.area)
    const shares = () => formState.companiesAreas.map((c: any) => c.rentPart)

    beforeEach(() => {
      formState.companiesAreas = companies.map((c, i) => ({
        _id: `id-${i + 1}`,
        name: c.companyName,
        area: c.totalArea,
        rentPart: c.rentPart,
        key: `id-${i + 1}`,
        _initialArea: c.totalArea,
        _initialRentPart: c.rentPart,
        _excluded: false,
        _pinned: false,
      }))
      ;(useGetAreasQuery as jest.Mock).mockReturnValue({
        data: { companies },
        isLoading: false,
        isFetching: false,
        refetch: mockRefetch,
      })
      ;(useGetAllRealEstateQuery as jest.Mock).mockReturnValue({
        data: {
          data: companies.map((c, i) => ({
            companyName: c.companyName,
            _id: `id-${i + 1}`,
            totalArea: c.totalArea,
          })),
        },
      })
    })

    test('Excluding a company keeps it in the table and leaves its data alone', () => {
      const { rerender } = renderCard()

      fireEvent.click(screen.getByTestId('exclude-company-2'))
      rerenderCard(rerender)

      expect(formState.companiesAreas).toHaveLength(3)
      expect(screen.getByText('Company C')).toBeInTheDocument()
      expect(formState.companiesAreas[2]).toMatchObject({
        _id: 'id-3',
        name: 'Company C',
        area: 20,
        rentPart: 50,
      })
      expect(screen.getByText('Виключено з розрахунку')).toBeInTheDocument()
    })

    test('An excluded company drops out of the total, the shares and the chart', () => {
      const { rerender } = renderCard()

      fireEvent.click(screen.getByTestId('exclude-company-2'))
      rerenderCard(rerender)

      expect(shares().slice(0, 2)).toEqual([50, 50])
      expect(screen.getByText('20.00 м²')).toBeInTheDocument()
      expect(screen.getByText('100.00%')).toBeInTheDocument()
      expect(screen.getByText('—')).toBeInTheDocument()
      expect(getChartDataSources()).toEqual([
        { label: 'Company A', value: { part: 50, area: 10 } },
        { label: 'Company B', value: { part: 50, area: 10 } },
      ])
    })

    test('An excluded company can be returned to the calculation', () => {
      const { rerender } = renderCard()

      fireEvent.click(screen.getByTestId('exclude-company-2'))
      rerenderCard(rerender)

      fireEvent.click(screen.getByTestId('include-company-2'))
      rerenderCard(rerender)

      expect(shares()).toEqual([25, 25, 50])
      expect(screen.getByText('40.00 м²')).toBeInTheDocument()
      expect(screen.queryByText('Виключено з розрахунку')).toBeNull()
      expect(getChartDataSources()).toEqual([
        { label: 'Company A', value: { part: 25, area: 10 } },
        { label: 'Company B', value: { part: 25, area: 10 } },
        { label: 'Company C', value: { part: 50, area: 20 } },
      ])
    })

    test('Confirming an area pins it and feeds it into the calculation', () => {
      const { rerender } = renderCard()

      fireEvent.change(screen.getAllByRole('spinbutton')[0], {
        target: { value: '20' },
      })
      rerenderCard(rerender)
      expect(shares()).toEqual([25, 25, 50])

      fireEvent.click(screen.getByTestId('pin-area-0'))
      rerenderCard(rerender)

      expect(areas()).toEqual([20, 10, 20])
      expect(shares()).toEqual([40, 20, 40])
      expect(screen.getByText('Зафіксовано')).toBeInTheDocument()
      expect(screen.getByTestId('unpin-area-0')).toBeInTheDocument()
    })

    test('Pinning one company does not change the state of the others', () => {
      const { rerender } = renderCard()

      fireEvent.click(screen.getByTestId('pin-area-0'))
      rerenderCard(rerender)

      expect(formState.companiesAreas.map((c: any) => c._pinned)).toEqual([
        true,
        false,
        false,
      ])
      expect(areas()).toEqual([10, 10, 20])
      expect(screen.getAllByText('Зафіксовано')).toHaveLength(1)
      expect(screen.queryByTestId('unpin-area-1')).toBeNull()
    })

    test('A pinned area survives a recalculation', () => {
      const { rerender } = renderCard()

      fireEvent.change(screen.getAllByRole('spinbutton')[0], {
        target: { value: '30' },
      })
      rerenderCard(rerender)
      fireEvent.click(screen.getByTestId('pin-area-0'))
      rerenderCard(rerender)

      fireEvent.click(screen.getByTestId('recalculate-button'))
      rerenderCard(rerender)

      expect(areas()).toEqual([30, 10, 20])
      expect(shares()[0]).toBe(50)
      expect(shares()[1]).toBeCloseTo(16.67, 2)
      expect(shares()[2]).toBeCloseTo(33.33, 2)
    })

    test('Cancelling the pin restores the standard way of getting the value', () => {
      const { rerender } = renderCard()

      fireEvent.change(screen.getAllByRole('spinbutton')[0], {
        target: { value: '30' },
      })
      rerenderCard(rerender)
      fireEvent.click(screen.getByTestId('pin-area-0'))
      rerenderCard(rerender)
      expect(areas()).toEqual([30, 10, 20])

      fireEvent.click(screen.getByTestId('unpin-area-0'))
      rerenderCard(rerender)

      expect(areas()).toEqual([10, 10, 20])
      expect(shares()).toEqual([25, 25, 50])
      expect(screen.queryByText('Зафіксовано')).toBeNull()
      expect(screen.queryByTestId('unpin-area-0')).toBeNull()
      expect(screen.getByTestId('pin-area-0')).toBeInTheDocument()
    })

    test('One company excluded and another pinned work together', () => {
      const { rerender } = renderCard()

      fireEvent.change(screen.getAllByRole('spinbutton')[0], {
        target: { value: '30' },
      })
      rerenderCard(rerender)
      fireEvent.click(screen.getByTestId('pin-area-0'))
      rerenderCard(rerender)
      fireEvent.click(screen.getByTestId('exclude-company-2'))
      rerenderCard(rerender)

      expect(shares().slice(0, 2)).toEqual([75, 25])
      expect(screen.getByText('40.00 м²')).toBeInTheDocument()
      expect(screen.getByText('100.00%')).toBeInTheDocument()
      expect(screen.getByText('Зафіксовано')).toBeInTheDocument()
      expect(screen.getByText('Виключено з розрахунку')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('include-company-2'))
      rerenderCard(rerender)

      expect(areas()).toEqual([30, 10, 20])
      expect(shares()[0]).toBe(50)
      expect(shares()[1]).toBeCloseTo(16.67, 2)
      expect(shares()[2]).toBeCloseTo(33.33, 2)
      expect(screen.getByText('60.00 м²')).toBeInTheDocument()
    })

    test('Reload clears the exclusions and the pinned values', async () => {
      const { rerender } = renderCard()

      fireEvent.change(screen.getAllByRole('spinbutton')[0], {
        target: { value: '30' },
      })
      rerenderCard(rerender)
      fireEvent.click(screen.getByTestId('pin-area-0'))
      rerenderCard(rerender)
      fireEvent.click(screen.getByTestId('exclude-company-2'))
      rerenderCard(rerender)

      fireEvent.click(screen.getByTestId('reload-button'))
      expect(formState.companiesAreas).toEqual([])
      ;(useGetAreasQuery as jest.Mock).mockReturnValue({
        data: { companies: [...companies] },
        isLoading: false,
        isFetching: false,
        refetch: mockRefetch,
      })
      rerenderCard(rerender)

      await waitFor(() => {
        expect(formState.companiesAreas).toHaveLength(3)
      })
      rerenderCard(rerender)

      expect(areas()).toEqual([10, 10, 20])
      expect(shares()).toEqual([25, 25, 50])
      expect(formState.companiesAreas.map((c: any) => c._pinned)).toEqual([
        false,
        false,
        false,
      ])
      expect(formState.companiesAreas.map((c: any) => c._excluded)).toEqual([
        false,
        false,
        false,
      ])
      expect(screen.queryByText('Зафіксовано')).toBeNull()
      expect(screen.queryByText('Виключено з розрахунку')).toBeNull()
      expect(screen.getByText('40.00 м²')).toBeInTheDocument()
      expect(getChartDataSources()).toEqual([
        { label: 'Company A', value: { part: 25, area: 10 } },
        { label: 'Company B', value: { part: 25, area: 10 } },
        { label: 'Company C', value: { part: 50, area: 20 } },
      ])
    })

    test('Every state offers exactly the actions that belong to it', () => {
      const { rerender } = renderCard()

      expect(screen.getByTestId('pin-area-0')).toBeInTheDocument()
      expect(screen.getByTestId('exclude-company-0')).toBeInTheDocument()
      expect(screen.queryByTestId('unpin-area-0')).toBeNull()
      expect(screen.queryByTestId('include-company-0')).toBeNull()

      fireEvent.click(screen.getByTestId('pin-area-0'))
      rerenderCard(rerender)
      expect(screen.getByTestId('unpin-area-0')).toBeInTheDocument()
      expect(screen.getByTestId('exclude-company-0')).toBeInTheDocument()
      expect(screen.queryByTestId('include-company-0')).toBeNull()

      fireEvent.click(screen.getByTestId('exclude-company-0'))
      rerenderCard(rerender)
      expect(screen.getByTestId('include-company-0')).toBeInTheDocument()
      expect(screen.queryByTestId('pin-area-0')).toBeNull()
      expect(screen.queryByTestId('unpin-area-0')).toBeNull()
      expect(screen.queryByTestId('exclude-company-0')).toBeNull()
      expect(screen.getAllByRole('spinbutton')[0]).toBeDisabled()
    })

    test('Every row action carries a tooltip', async () => {
      const { rerender } = renderCard()

      fireEvent.mouseOver(screen.getByTestId('pin-area-0'))
      expect(
        await screen.findByText('Зафіксувати значення')
      ).toBeInTheDocument()

      fireEvent.mouseOver(screen.getByTestId('exclude-company-1'))
      expect(
        await screen.findByText('Виключити з розрахунку')
      ).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('pin-area-0'))
      rerenderCard(rerender)
      fireEvent.mouseOver(screen.getByTestId('unpin-area-0'))
      expect(await screen.findByText('Скасувати фіксацію')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('exclude-company-2'))
      rerenderCard(rerender)
      fireEvent.mouseOver(screen.getByTestId('include-company-2'))
      expect(
        await screen.findByText('Повернути в розрахунок')
      ).toBeInTheDocument()
    })

    test('Row actions are disabled in preview mode', () => {
      renderCard({ editable: false })

      expect(screen.getByTestId('pin-area-0')).toBeDisabled()
      expect(screen.getByTestId('exclude-company-0')).toBeDisabled()
    })
  })
})
