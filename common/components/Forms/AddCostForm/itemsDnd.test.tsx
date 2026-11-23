import { bucketFromDropId, canStartRowDrag } from './itemsDnd'

describe('canStartRowDrag', () => {
  const row = document.createElement('div')
  row.innerHTML = `
    <span class="gap">gap</span>
    <div class="ant-select"><span class="inner">Зарплати</span></div>
    <div class="ant-input-number"><input /></div>
    <input class="note" />
    <button>remove</button>`

  it('starts from the row itself, outside its fields', () => {
    expect(canStartRowDrag(row)).toBe(true)
    expect(canStartRowDrag(row.querySelector('.gap'))).toBe(true)
  })

  it('never starts from a field or button, so editing stays editing', () => {
    expect(canStartRowDrag(row.querySelector('.inner'))).toBe(false)
    expect(canStartRowDrag(row.querySelector('.ant-input-number input'))).toBe(
      false
    )
    expect(canStartRowDrag(row.querySelector('.note'))).toBe(false)
    expect(canStartRowDrag(row.querySelector('button'))).toBe(false)
  })
})

describe('bucketFromDropId', () => {
  it('maps both a header and a body drop to the block', () => {
    expect(bucketFromDropId('зарплати')).toBe('зарплати')
    expect(bucketFromDropId('зарплати#body')).toBe('зарплати')
  })
})
