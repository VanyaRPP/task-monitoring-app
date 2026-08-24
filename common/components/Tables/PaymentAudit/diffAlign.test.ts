import { alignSequences, repairRuns } from './diffAlign'

describe('alignSequences', () => {
  it('pairs common items and leaves inserts/deletes one-sided', () => {
    expect(alignSequences(['a', 'b', 'c'], ['a', 'x', 'c'], (v) => v)).toEqual([
      { left: 'a', right: 'a' },
      { left: 'b' },
      { right: 'x' },
      { left: 'c', right: 'c' },
    ])
  })

  it('handles an empty side', () => {
    expect(alignSequences([], ['a'], (v) => v)).toEqual([{ right: 'a' }])
    expect(alignSequences(['a'], [], (v) => v)).toEqual([{ left: 'a' }])
  })

  it('keeps a repeated line matched rather than shifting the whole tail', () => {
    expect(
      alignSequences(
        ['{', '"a": 1', '}'],
        ['{', '"a": 1', '"b": 2', '}'],
        (v) => v
      )
    ).toEqual([
      { left: '{', right: '{' },
      { left: '"a": 1', right: '"a": 1' },
      { right: '"b": 2' },
      { left: '}', right: '}' },
    ])
  })
})

describe('repairRuns', () => {
  it('re-pairs neighbouring one-sided entries that share a looser key', () => {
    const pairs = [
      { left: 'row:old', right: 'row:old' },
      { left: 'row:a' },
      { right: 'row:b' },
    ]

    expect(repairRuns(pairs, (value) => value.split(':')[0])).toEqual([
      { left: 'row:old', right: 'row:old' },
      { left: 'row:a', right: 'row:b' },
    ])
  })

  it('leaves entries alone when the looser key differs too', () => {
    const pairs = [{ left: 'row:a' }, { right: 'cell:b' }]

    expect(repairRuns(pairs, (value) => value.split(':')[0])).toEqual([
      { left: 'row:a' },
      { right: 'cell:b' },
    ])
  })
})
