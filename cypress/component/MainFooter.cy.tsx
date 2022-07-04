import { mount } from 'cypress/react'
import MainFooter from '../../components/MainFooter'

describe('<MainFooter />', () => {
  it('mounts', () => {
    mount(<MainFooter />)
  })
})
