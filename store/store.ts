import { categoryApi } from '../api/categoriesApi/category.api'
import { userApi } from './../api/userApi/user.api'
import { taskApi } from './../api/taskApi/task.api'
import themeReducer from './reducers/ThemeSlice'
import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit'

export const store = configureStore({
  reducer: {
    [categoryApi.reducerPath]: categoryApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(userApi.middleware)
      .concat(taskApi.middleware),
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>
