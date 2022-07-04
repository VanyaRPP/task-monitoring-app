import { mount } from 'cypress/react'
import MainHeader from '../../components/MainHeader'

describe('<MainHeader />', () => {
  it('mounts', () => {
    mount(<MainHeader />)
  })
})
