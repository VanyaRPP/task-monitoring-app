import { expect } from '@jest/globals'
import { toCleanObject } from '../'

describe('toCleanObject - OBJECT', () => {
  it('handle clean object unchanged', () => {
    expect(
      toCleanObject({
        key1: 1,
        key2: 2,
      })
    ).toBe({
      key1: 1,
      key2: 2,
    })
    expect(
      toCleanObject({
        key1: '1',
        key2: '2',
      })
    ).toBe({
      key1: '1',
      key2: '2',
    })
  })

  it('handle dirty object cleaned', () => {
    expect(
      toCleanObject({
        key1: 1,
        key2: null,
      })
    ).toBe({
      key1: 1,
    })
    expect(
      toCleanObject({
        key1: '1',
        key2: undefined,
      })
    ).toBe({
      key1: '1',
    })
  })
})
