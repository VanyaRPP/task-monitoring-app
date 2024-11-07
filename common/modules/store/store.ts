import { categoryApi } from '@common/api/categoriesApi/category.api'
import { customerApi } from '@common/api/customerApi/customer.api'
import { domainApi } from '@common/api/domainApi/domain.api'
import { notificationApi } from '@common/api/notificationApi/notification.api'
import { paymentApi } from '@common/api/paymentApi/payment.api'
import { realestateApi } from '@common/api/realestateApi/realestate.api'
import { serviceApi } from '@common/api/serviceApi/service.api'
import { streetApi } from '@common/api/streetApi/street.api'
import { taskApi } from '@common/api/taskApi/task.api'
import { userApi } from '@common/api/userApi/user.api'
import { bankApi } from '@common/api/bankApi/bank.api'
import sidebarReducer from '@modules/store/sidebarSlice'
import themeReducer from '@modules/store/themeSlice'
import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit'

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
    [bankApi.reducerPath]: bankApi.reducer,
    sidebar: sidebarReducer,
    theme: themeReducer,
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
      .concat(bankApi.middleware),
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>
