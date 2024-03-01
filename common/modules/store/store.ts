import { customerApi } from '@common/api/customerApi/customer.api'
import { emailApi } from '@common/api/emailApi/email.api'
import { notificationApi } from '@common/api/notificationApi/notification.api'
import { paymentApi } from '@common/api/paymentApi/payment.api'
import { realestateApi } from '@common/api/realestateApi/realestate.api'
import { serviceApi } from '@common/api/serviceApi/service.api'
import { streetApi } from '@common/api/streetApi/street.api'
import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit'
import { categoryApi } from '../../api/categoriesApi/category.api'
import { domainApi } from '../../api/domainApi/domain.api'
import { taskApi } from '../../api/taskApi/task.api'
import { userApi } from '../../api/userApi/user.api'
import themeReducer from './reducers/ThemeSlice'

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
    [streetApi.reducerPath]: streetApi.reducer,
    [emailApi.reducerPath]: emailApi.reducer,
    themeReducer,
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
      .concat(streetApi.middleware)
      .concat(emailApi.middleware),
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>
