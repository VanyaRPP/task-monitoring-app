import { Profit } from '@common/api/profitsApi/profits.type'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'


interface ProfitMonthSummary {
  key: string
  month: string
  debit: number
  credit: number
  profit: number
  count: number
  transactions: Profit[]
}


// Ця функція поза React-компонентом, вона не є React хуком і не виконується в контексті React.

// Через це там неможна просто викликати React-хук useTranslation() (бо хуки можна викликати лише в функціях-компонентах або кастомних хуках).

// Тому потрібно передати функцію перекладу t як аргумент, щоб дати їй доступ до перекладів.
export const getParentColumns = (                        
  t: (key: string, options?: any) => string
): ColumnsType<ProfitMonthSummary> => [
  {
    title: t('table.parent.month'),
    dataIndex: 'month',
    key: 'month',
    render: (month: string) =>
      dayjs(month).isValid() ? dayjs(month).format('MMMM YYYY') : month,
  },
  {
    title: t('table.parent.debit'),
    dataIndex: 'debit',
    key: 'debit',
    render: (value: number) => value.toFixed(2),
  },
  {
    title: t('table.parent.credit'),
    dataIndex: 'credit',
    key: 'credit',
    render: (value: number) => value.toFixed(2),
  },
  {
    title: t('table.parent.profit'),
    dataIndex: 'profit',
    key: 'profit',
    render: (value: number) => (
      <span style={{ color: value >= 0 ? 'green' : 'red' }}>
        {value.toFixed(2)}
      </span>
    ),
  },
  {
    title: t('table.parent.totalRecords'),
    dataIndex: 'count',
    key: 'count',
  },
]

export const getChildColumns = (
  t: (key: string, options?: any) => string
): ColumnsType<Profit> => [
  {
    title: t('table.child.date'),
    dataIndex: 'date',
    key: 'date',
    render: (date: string) => new Date(date).toLocaleDateString(),
  },
  {
    title: t('table.child.type'),
    dataIndex: 'type',
    key: 'type',
    render: (type: string) => {
      if (type === 'debit') return t('table.child.debit')
      if (type === 'credit') return t('table.child.credit')
      return type
    },
  },
  {
    title: t('table.child.amount'),
    dataIndex: 'amount',
    key: 'amount',
  },
  {
    title: t('table.child.description'),
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: t('table.child.categories'),
    dataIndex: 'categories',
    key: 'categories',
    render: (cats: string[]) => cats?.join(', ') || '-',
  },
]


//Переклад назв колонок таблиці не оновлювався після зміни мови.

// Використовували t() з i18next поза компонентом, тобто поза рендер-функцією (const parentColumns = [...] — було створено один раз при імпорті).

// А t() — це функція, яка залежить від контексту компонента та його мови. Вона не буде "реактивно" перекладати, якщо її викликати до рендеру.




// export const parentColumns: ColumnsType<ProfitMonthSummary> = [
//   {
//     title: t('table.parent.month', { ns: 'profitPage' }), // t() викликалось поза компонентом і тому не оновлювалось при змінні мови
//   },
// ]



// export const getParentColumns = (t): ColumnsType<ProfitMonthSummary> => [
//   {
//     title: t('table.parent.month'), // Тепер це функція, яка приймає t як аргумент. 
// Ми викликаємо її прямо в компоненті, тому переклад завжди буде актуальним.
//   },
// ]