import { ICategory } from '@modules/models/Category'
export type { ICategory } from '@modules/models/Category'

export interface AllCategoriesQuery {
  success: boolean
  data: ICategory[]
}

export interface BaseQuery {
  success: boolean
  data: ICategory
}
