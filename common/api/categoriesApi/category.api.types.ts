import { ICategory } from 'common/modules/models/Category'
export type { ICategory } from 'common/modules/models/Category'

export interface AllCategoriesQuery {
  success: boolean
  data: ICategory[]
}

export interface BaseQuery {
  success: boolean
  data: ICategory
}
