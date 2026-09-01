import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form, type FormInstance } from 'antd'
import DomainModalType from '.'
import {
  DomainTypeTemplateCategory,
  IDomainTypeTemplate,
} from '@common/api/domainApi/domain.api.types'

interface MockCreateTemplateModalProps {
  onCreated: (created: Pick<IDomainTypeTemplate, '_id' | 'category'>) => void
}

interface RenderComponentProps {
  templates?: IDomainTypeTemplate[]
  editable?: boolean
  onTemplateChange?: jest.Mock<void, [string | null]>
  initialValues?: {
    domainTypeTemplateId?: string | null
  }
}

const CREATED_CATEGORY: DomainTypeTemplateCategory = 'it'

jest.mock('./CreateTemplateModal', () => {
  return function MockCreateTemplateModal({
    onCreated,
  }: MockCreateTemplateModalProps) {
    return (
      <button
        data-testid="mock-create-template"
        onClick={() =>
          onCreated({
            _id: 'created-template',
            category: CREATED_CATEGORY,
          })
        }
      >
        Mock Create
      </button>
    )
  }
})

jest.mock('@utils/domain/domain-type-template-categories', () => ({
  DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS: [
    {
      value: 'utility',
      label: 'Комунальні',
    },
    {
      value: 'it',
      label: 'IT',
    },
  ],
}))

const MOCK_TEMPLATES: IDomainTypeTemplate[] = [
  {
    _id: 'tpl-utility-1',
    name: 'Стандартні комунальні',
    category: 'utility',
    isBuiltIn: true,
    groups: [
      {
        groupName: 'ЖКГ',
        serviceIds: ['srv-1', 'srv-2'],
      },
    ],
  },
  {
    _id: 'tpl-utility-2',
    name: 'Кастомні комунальні',
    category: 'utility',
    isBuiltIn: false,
    groups: [],
  },
  {
    _id: 'tpl-it-1',
    name: 'IT Послуги',
    category: 'it',
    isBuiltIn: true,
    groups: [
      {
        groupName: 'Розробка',
        serviceIds: ['srv-3'],
      },
    ],
  },
]

const renderComponent = (props?: RenderComponentProps) => {
  const templates = props?.templates ?? MOCK_TEMPLATES
  const editable = props?.editable ?? true
  const mockChange = props?.onTemplateChange ?? jest.fn()
  const initialValues = props?.initialValues ?? {}

  let formInstance!: FormInstance

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const [form] = Form.useForm()

    formInstance = form

    return (
      <Form form={form} initialValues={initialValues}>
        {children}
      </Form>
    )
  }

  const result = render(
    <Wrapper>
      <DomainModalType
        templates={templates}
        editable={editable}
        onTemplateChange={mockChange}
      />
    </Wrapper>
  )

  return {
    ...result,
    formInstance,
    mockChange,
  }
}

const openTemplateSelect = async () => {
  const selects = screen.getAllByRole('combobox')
  await userEvent.click(selects[0])
}

const openCategorySelect = async () => {
  const selects = screen.getAllByRole('combobox')
  await userEvent.click(selects[1])
}

const getCategoryFormItem = () =>
  screen.getByText('Категорія').closest('.ant-form-item')

describe('rendering', () => {
  it('should render template and category fields', () => {
    renderComponent()

    expect(screen.getByText(/Категорія/i)).toBeInTheDocument()
    expect(screen.getByText(/Тип послуг \(шаблон\)/i)).toBeInTheDocument()
  })

  it('should render the create template button by default', () => {
    renderComponent()

    expect(
      screen.getByRole('button', { name: /\+ Створити новий шаблон/i })
    ).toBeInTheDocument()
  })

  it('should not render the create template button when editable is false', () => {
    renderComponent({ editable: false })

    expect(
      screen.queryByRole('button', { name: /\+ Створити новий шаблон/i })
    ).not.toBeInTheDocument()
  })
})

describe('category synchronization', () => {
  it('should synchronize the category on initial render when a template is preselected', async () => {
    renderComponent({
      initialValues: {
        domainTypeTemplateId: 'tpl-utility-1',
      },
    })

    await waitFor(() =>
      expect(getCategoryFormItem()).toHaveTextContent('Комунальні')
    )
  })

  it('should clear the selected template when the category changes', async () => {
    const user = userEvent.setup()

    const { formInstance, mockChange } = renderComponent({
      initialValues: {
        domainTypeTemplateId: 'tpl-utility-1',
      },
    })

    await openCategorySelect()

    await user.click(await screen.findByText('IT'))

    expect(formInstance.getFieldValue('domainTypeTemplateId')).toBeNull()
    expect(mockChange).toHaveBeenCalledTimes(1)
    expect(mockChange).toHaveBeenCalledWith(null)
  })

  it('should synchronize the category when a template is selected', async () => {
    const user = userEvent.setup()

    const { mockChange } = renderComponent()

    await openTemplateSelect()

    await user.click(await screen.findByText('IT Послуги'))

    expect(mockChange).toHaveBeenCalledWith('tpl-it-1')

    await waitFor(() => expect(getCategoryFormItem()).toHaveTextContent('IT'))
  })
})

describe('template filtering', () => {
  it('should filter available templates by selected category', async () => {
    const user = userEvent.setup()

    renderComponent()

    await openCategorySelect()

    await user.click(await screen.findByText('Комунальні'))

    await openTemplateSelect()

    expect(screen.getByText('Стандартні комунальні')).toBeInTheDocument()
    expect(screen.getByText('Кастомні комунальні (адмін)')).toBeInTheDocument()
    expect(screen.queryByText('IT Послуги')).not.toBeInTheDocument()
  })
})

describe('template creation', () => {
  it('should update the form after creating a new template', async () => {
    const user = userEvent.setup()

    const { formInstance, mockChange } = renderComponent()

    await user.click(screen.getByTestId('mock-create-template'))

    expect(formInstance.getFieldValue('domainTypeTemplateId')).toBe(
      'created-template'
    )
    expect(mockChange).toHaveBeenCalledWith('created-template')

    await waitFor(() => expect(getCategoryFormItem()).toHaveTextContent('IT'))
  })
})
