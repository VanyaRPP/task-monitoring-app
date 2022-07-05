import { mount } from 'cypress/react'
import MainFooter from '~/components/Footer'

describe('<Stepper>', () => {
  it('mounts', () => {
    mount(<MainFooter />)
  })
})
