import { widenFilterDropdown } from './tableFilterHelpers'

const flushRaf = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

describe('widenFilterDropdown', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('does nothing when the dropdown closes', async () => {
    document.body.innerHTML = `
      <div class="ant-table-filter-dropdown" style="width: 100px">
        <label class="ant-checkbox-wrapper">
          <span class="ant-checkbox"></span>
          <span>A very long option label</span>
        </label>
      </div>
    `
    widenFilterDropdown(240)(false)
    await flushRaf()

    const dropdown = document.querySelector<HTMLElement>(
      '.ant-table-filter-dropdown'
    )
    expect(dropdown?.style.width).toBe('100px')
  })

  it('widens the dropdown and wraps long checkbox labels on open', async () => {
    document.body.innerHTML = `
      <div class="ant-table-filter-dropdown">
        <label class="ant-checkbox-wrapper">
          <span class="ant-checkbox"></span>
          <span>A very long option label that would otherwise overflow</span>
        </label>
      </div>
    `
    widenFilterDropdown(240)(true)
    await flushRaf()

    const dropdown = document.querySelector<HTMLElement>(
      '.ant-table-filter-dropdown'
    )
    expect(dropdown?.style.width).toBe('240px')
    expect(dropdown?.style.maxWidth).toBe('90vw')

    const label = document.querySelector<HTMLElement>('.ant-checkbox + span')
    expect(label?.style.whiteSpace).toBe('normal')
    expect(label?.style.wordBreak).toBe('break-word')
  })

  it('uses the default width of 240 when none is provided', async () => {
    document.body.innerHTML = `<div class="ant-table-filter-dropdown"></div>`
    widenFilterDropdown()(true)
    await flushRaf()

    expect(
      document.querySelector<HTMLElement>('.ant-table-filter-dropdown')?.style
        .width
    ).toBe('240px')
  })
})
