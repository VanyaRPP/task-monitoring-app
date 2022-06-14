import { RootState } from './../../store/store';
import {
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

export type userState = {
  user: boolean;
};

const initialState: userState = {
  user: false
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: state => {
      state.user = true;
    },
    logout: state => {
      state.user = false;
    },
  },
});

export const {
  login,
  logout
} = userSlice.actions;


export const selectUser = (state: RootState) => state.user.user;

export default userSlice.reducer;