import { render, screen } from '@testing-library/react'
import { Form } from 'antd'
import TemplateTab from './TemplateTab'

jest.mock('../style.module.scss', () => ({ templateItem: 'templateItem' }))

const renderInForm = (
  initialValues?: { defaultTemplate?: string },
  editable = true
) =>
  render(
    <Form initialValues={initialValues}>
      <TemplateTab editable={editable} />
    </Form>
  )

describe('TemplateTab', () => {
  it('renders the field label', () => {
    renderInForm()
    expect(
      screen.getByText(/Шаблон за замовчуванням для рахунків/i)
    ).toBeInTheDocument()
  })

  it('shows the selected option label when initialValue matches', () => {
    renderInForm({ defaultTemplate: 'olimp' })
    expect(screen.getByText('OLIMP DIGITAL OÜ')).toBeInTheDocument()
  })

  it('shows placeholder when no initialValue', () => {
    renderInForm()
    // antd renders the placeholder text inside the select when value is empty.
    expect(screen.getByText('Класичний шаблон')).toBeInTheDocument()
  })

  it('disables the select when editable=false', () => {
    const { container } = renderInForm({ defaultTemplate: 'classic' }, false)
    const selector = container.querySelector('.ant-select')
    expect(selector?.classList.contains('ant-select-disabled')).toBe(true)
  })
})
