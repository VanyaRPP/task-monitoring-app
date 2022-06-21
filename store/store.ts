import { userApi } from './../api/userApi/user.api';
import {
  Action,
  configureStore,
  ThunkAction,
} from '@reduxjs/toolkit';
import userReduser from '../features/user/userSlice';

export const store = configureStore({
  reducer: {
    // user: userReduser,
    [userApi.reducerPath]: userApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(userApi.middleware),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;