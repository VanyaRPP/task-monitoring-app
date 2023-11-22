import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit'
import { categoryApi } from '../../api/categoriesApi/category.api'
import { userApi } from '../../api/userApi/user.api'
import { taskApi } from '../../api/taskApi/task.api'
import { domainApi } from '../../api/domainApi/domain.api'
import themeReducer from './reducers/ThemeSlice'
import selectionsReducer from './reducers/SelectionsSlice'
import { notificationApi } from '@common/api/notificationApi/notification.api'
import { paymentApi } from '@common/api/paymentApi/payment.api'
import { serviceApi } from '@common/api/serviceApi/service.api'
import { customerApi } from '@common/api/customerApi/customer.api'
import { realestateApi } from '@common/api/realestateApi/realestate.api'
import { streetApi } from '@common/api/streetApi/street.api'

export const store = configureStore({
  reducer: {
    [categoryApi.reducerPath]: categoryApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [domainApi.reducerPath]: domainApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [serviceApi.reducerPath]: serviceApi.reducer,
    [customerApi.reducerPath]: customerApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [realestateApi.reducerPath]: realestateApi.reducer,
    themeReducer,
    selectionsReducer,
    [streetApi.reducerPath]: streetApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(userApi.middleware)
      .concat(taskApi.middleware)
      .concat(categoryApi.middleware)
      .concat(domainApi.middleware)
      .concat(paymentApi.middleware)
      .concat(serviceApi.middleware)
      .concat(customerApi.middleware)
      .concat(notificationApi.middleware)
      .concat(realestateApi.middleware)
      .concat(streetApi.middleware),
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>
