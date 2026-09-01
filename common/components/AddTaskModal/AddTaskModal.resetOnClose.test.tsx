import { render, screen, fireEvent, act } from '@testing-library/react'
import AddTaskModal from './index'

jest.mock('@react-google-maps/api', () => ({
  useJsApiLoader: () => ({ isLoaded: true }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { email: 'user@test.com' } } }),
}))

jest.mock('@common/api/categoriesApi/category.api', () => ({
  useGetAllCategoriesQuery: () => ({ data: { data: [] } }),
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetUserByEmailQuery: () => ({
    data: { data: { _id: 'u1', roles: [] } },
  }),
}))

const addTaskMock = jest.fn().mockResolvedValue({ data: {} })
jest.mock('@common/api/taskApi/task.api', () => ({
  useAddTaskMutation: () => [addTaskMock],
}))

let capturedSetAddress: ((address: any) => void) | null = null
jest.mock(
  '../PlacesAutocomplete',
  () => ({
    __esModule: true,
    PlacesAutocomplete: ({ setAddress }: any) => {
      capturedSetAddress = setAddress
      return <div data-testid="places-autocomplete" />
    },
  }),
  { virtual: true }
)

const mapMock = jest.fn()
jest.mock('../Map', () => ({
  __esModule: true,
  default: (props: any) => {
    mapMock(props.mapOptions)
    return <div data-testid="map" />
  },
}))

const someAddress = { geoCode: { lat: 50, lng: 30 }, address: 'вул. Тестова 1' }

describe('AddTaskModal — стан адреси не переноситься між відкриттями', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedSetAddress = null
  })

  it('AddTaskModal ніколи не розмонтовується (видимість керується пропом), тож локальний стан адреси мусить скидатись вручну', () => {
    // Компонент керується `isModalVisible`, а не умовним рендером —
    // тому очищення useState-полів при закритті не відбувається саме
    // собою через unmount, як у RealEstateModal.
    const { rerender } = render(
      <AddTaskModal isModalVisible setIsModalVisible={jest.fn()} />
    )
    expect(screen.getByTestId('places-autocomplete')).toBeInTheDocument()

    rerender(
      <AddTaskModal isModalVisible={false} setIsModalVisible={jest.fn()} />
    )
    rerender(<AddTaskModal isModalVisible setIsModalVisible={jest.fn()} />)

    // Компонент лишається змонтованим протягом усього циклу open -> close -> open.
    expect(screen.getByTestId('places-autocomplete')).toBeInTheDocument()
  })

  it('вибрана адреса скидається після натискання "Скасувати"', () => {
    render(<AddTaskModal isModalVisible setIsModalVisible={jest.fn()} />)

    act(() => {
      capturedSetAddress?.(someAddress)
    })

    expect(mapMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ zoom: 17 })
    )

    fireEvent.click(screen.getByText('Скасувати'))

    expect(mapMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ zoom: 12 })
    )
  })

  it('після повторного відкриття попередньо обрана адреса не підставляється знову', () => {
    const setIsModalVisible = jest.fn()
    const { rerender } = render(
      <AddTaskModal isModalVisible setIsModalVisible={setIsModalVisible} />
    )

    act(() => {
      capturedSetAddress?.(someAddress)
    })
    expect(mapMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ zoom: 17 })
    )

    fireEvent.click(screen.getByText('Скасувати'))

    rerender(
      <AddTaskModal
        isModalVisible={false}
        setIsModalVisible={setIsModalVisible}
      />
    )
    rerender(
      <AddTaskModal isModalVisible setIsModalVisible={setIsModalVisible} />
    )

    expect(mapMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ zoom: 12 })
    )
  })
})
