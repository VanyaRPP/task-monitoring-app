import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InvoiceLanguageSelector from './index'

describe('InvoiceLanguageSelector', () => {
  it('renders both UA and EN buttons', () => {
    render(<InvoiceLanguageSelector lang="uk" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'UA' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
  })

  it('UA button has active class when lang=uk', () => {
    render(<InvoiceLanguageSelector lang="uk" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'UA' }).className).toMatch(
      /active/
    )
    expect(screen.getByRole('button', { name: 'EN' }).className).not.toMatch(
      /active/
    )
  })

  it('EN button has active class when lang=en', () => {
    render(<InvoiceLanguageSelector lang="en" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'EN' }).className).toMatch(
      /active/
    )
    expect(screen.getByRole('button', { name: 'UA' }).className).not.toMatch(
      /active/
    )
  })

  it('calls onChange with en when EN is clicked', async () => {
    const onChange = jest.fn()
    render(<InvoiceLanguageSelector lang="uk" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('en')
  })

  it('calls onChange with uk when UA is clicked', async () => {
    const onChange = jest.fn()
    render(<InvoiceLanguageSelector lang="en" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'UA' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('uk')
  })

  it('does not call onChange when already active button is clicked', async () => {
    const onChange = jest.fn()
    render(<InvoiceLanguageSelector lang="uk" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'UA' }))
    expect(onChange).toHaveBeenCalledWith('uk')
  })
})
