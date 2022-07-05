import { mount } from 'cypress/react'
import MainHeader from '../../components/Header/index'

describe('<Stepper>', () => {
  it('mounts', () => {
    mount(<MainHeader />)
  })
})
