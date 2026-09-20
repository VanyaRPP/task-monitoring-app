import { act, fireEvent, render, screen, within } from '@testing-library/react'
import ChartComponent from './index'

const mockChartInstance = {
  destroy: jest.fn(),
  update: jest.fn(),
  toggleDataVisibility: jest.fn(),
  setActiveElements: jest.fn(),
  tooltip: { setActiveElements: jest.fn() },
}

jest.mock('chart.js/auto', () =>
  jest.fn().mockImplementation(() => mockChartInstance)
)

let resizeCallback: ((entries: any[]) => void) | null = null

const makeData = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    label: `Company ${i + 1}`,
    value: { part: 100 / count, area: 10 },
  }))

const renderChart = (count: number) =>
  render(
    <ChartComponent
      dataSources={makeData(count)}
      chartTitle="Розподіл площ"
      domainName="Загальна площа"
    />
  )

const resizeContainer = (width: number) =>
  act(() => {
    resizeCallback?.([{ contentRect: { width } }])
  })

describe('ChartComponent legend', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resizeCallback = null
    ;(global as any).ResizeObserver = jest.fn().mockImplementation((cb) => {
      resizeCallback = cb
      return { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() }
    })
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({}) as any)
  })

  test('Renders every company with its own color', () => {
    renderChart(4)

    const items = screen.getAllByTestId('chart-legend-item')
    expect(items).toHaveLength(4)
    expect(items[0]).toHaveTextContent('Company 1')
    expect(items[0]).toHaveAttribute('title', 'Company 1')
    expect(screen.queryByTestId('chart-legend-toggle')).toBeNull()
  })

  test('Splits the companies evenly into three columns', () => {
    renderChart(7)

    const columns = screen.getAllByTestId('chart-legend-column')
    expect(columns).toHaveLength(3)
    expect(
      columns.map((c) => within(c).getAllByTestId('chart-legend-item').length)
    ).toEqual([3, 2, 2])
  })

  test('Uses two columns when there is less room for the legend', () => {
    renderChart(12)
    resizeContainer(400)

    expect(screen.getByTestId('chart-layout')).toHaveClass('stacked')
    expect(screen.getAllByTestId('chart-legend-column')).toHaveLength(2)
  })

  test('Keeps the chart next to the legend on a wide container', () => {
    renderChart(12)
    resizeContainer(1000)

    expect(screen.getByTestId('chart-layout')).not.toHaveClass('stacked')
    expect(screen.getAllByTestId('chart-legend-column')).toHaveLength(3)
  })

  test('Does not offer the toggle when every company fits', () => {
    renderChart(33)

    expect(screen.getAllByTestId('chart-legend-item')).toHaveLength(33)
    expect(screen.queryByTestId('chart-legend-toggle')).toBeNull()
  })

  test('Shows a short list and expands it on demand', () => {
    renderChart(50)

    expect(screen.getAllByTestId('chart-legend-item')).toHaveLength(30)
    const toggle = screen.getByTestId('chart-legend-toggle')
    expect(toggle).toHaveTextContent('Показати всі компанії (ще 20)')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(toggle)

    expect(screen.getAllByTestId('chart-legend-item')).toHaveLength(50)
    expect(screen.getByText('Company 50')).toBeInTheDocument()
    expect(toggle).toHaveTextContent('Згорнути список')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(toggle)

    expect(screen.getAllByTestId('chart-legend-item')).toHaveLength(30)
    expect(screen.queryByText('Company 50')).toBeNull()
  })

  test('Clicking a company toggles its segment on the chart', () => {
    renderChart(3)

    const item = screen.getAllByTestId('chart-legend-item')[1]
    fireEvent.click(item)

    expect(mockChartInstance.toggleDataVisibility).toHaveBeenCalledWith(1)
    expect(mockChartInstance.update).toHaveBeenCalled()
    expect(item).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(item)
    expect(item).toHaveAttribute('aria-pressed', 'true')
  })

  test('Hovering a company highlights its segment', () => {
    renderChart(3)

    const item = screen.getAllByTestId('chart-legend-item')[2]
    fireEvent.mouseEnter(item)
    expect(mockChartInstance.setActiveElements).toHaveBeenLastCalledWith([
      { datasetIndex: 0, index: 2 },
    ])

    fireEvent.mouseLeave(item)
    expect(mockChartInstance.setActiveElements).toHaveBeenLastCalledWith([])
  })

  test('Shows the empty state without a legend when all areas are zero', () => {
    render(
      <ChartComponent
        dataSources={[{ label: 'A', value: { part: 0, area: 0 } }]}
        chartTitle=""
        domainName=""
      />
    )

    expect(screen.getByText('Усі площі дорівнюють нулю')).toBeInTheDocument()
    expect(screen.queryByTestId('chart-legend')).toBeNull()
  })
})
