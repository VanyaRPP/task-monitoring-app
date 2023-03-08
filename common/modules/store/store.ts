import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit'
import { categoryApi } from '../../api/categoriesApi/category.api'
import { userApi } from '../../api/userApi/user.api'
import { taskApi } from '../../api/taskApi/task.api'
import { domainApi } from '../../api/domainApi/domain.api'
import themeReducer from './reducers/ThemeSlice'
import { notificationApi } from '@common/api/notificationApi/notification.api'
import { paymentApi } from '@common/api/paymentApi/payment.api'
import { favorApi } from '@common/api/favorApi/favor.api'

export const store = configureStore({
  reducer: {
    [categoryApi.reducerPath]: categoryApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [domainApi.reducerPath]: domainApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [favorApi.reducerPath]: favorApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(userApi.middleware)
      .concat(taskApi.middleware)
      .concat(categoryApi.middleware)
      .concat(paymentApi.middleware)
      .concat(favorApi.middleware)
      .concat(notificationApi.middleware),
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>
