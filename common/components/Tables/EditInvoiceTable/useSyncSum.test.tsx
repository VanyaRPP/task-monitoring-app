import { describe, expect, it, jest } from '@jest/globals'
import { renderHook } from '@testing-library/react'
import useSyncSum from './useSyncSum'

const makeForm = () => ({
  setFieldValue: jest.fn(),
})

describe('useSyncSum', () => {
  it('writes the computed sum into the correct invoice row path on first render', () => {
    const form = makeForm()
    renderHook(() => useSyncSum(form as any, [0], 250))

    expect(form.setFieldValue).toHaveBeenCalledTimes(1)
    expect(form.setFieldValue).toHaveBeenCalledWith(['invoice', 0, 'sum'], 250)
  })

  it('rewrites only when the computed sum changes', () => {
    const form = makeForm()
    const { rerender } = renderHook(
      ({ sum }: { sum: number }) => useSyncSum(form as any, [2], sum),
      { initialProps: { sum: 100 } }
    )

    rerender({ sum: 100 })
    rerender({ sum: 100 })

    expect(form.setFieldValue).toHaveBeenCalledTimes(1)

    rerender({ sum: 175 })
    expect(form.setFieldValue).toHaveBeenCalledTimes(2)
    expect(form.setFieldValue).toHaveBeenLastCalledWith(
      ['invoice', 2, 'sum'],
      175
    )
  })

  it('treats two name arrays with identical contents as equal (no extra writes)', () => {
    const form = makeForm()
    const { rerender } = renderHook(
      ({ name }: { name: (string | number)[] }) =>
        useSyncSum(form as any, name, 50),
      { initialProps: { name: [3] as (string | number)[] } }
    )

    rerender({ name: [3] })
    rerender({ name: [3] })

    expect(form.setFieldValue).toHaveBeenCalledTimes(1)
  })

  it('rewrites when the row index changes', () => {
    const form = makeForm()
    const { rerender } = renderHook(
      ({ name }: { name: (string | number)[] }) =>
        useSyncSum(form as any, name, 50),
      { initialProps: { name: [0] as (string | number)[] } }
    )
    rerender({ name: [1] })

    expect(form.setFieldValue).toHaveBeenCalledTimes(2)
    expect(form.setFieldValue).toHaveBeenNthCalledWith(
      1,
      ['invoice', 0, 'sum'],
      50
    )
    expect(form.setFieldValue).toHaveBeenNthCalledWith(
      2,
      ['invoice', 1, 'sum'],
      50
    )
  })
})
