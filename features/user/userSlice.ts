// import { RootState } from './../../store/store';
// import {
//   createSlice,
//   PayloadAction,
// } from '@reduxjs/toolkit';

// export type userState = {
//   user: any;
// };

// const initialState: userState = {
//   user: null
// };

// export const userSlice = createSlice({
//   name: 'user',
//   initialState,
//   reducers: {
//     saveUser: (state, action: PayloadAction) => {
//       state.user = action.payload;
//     },
//     unsaveUser: state => {
//       state.user = null;
//     },
//   },
// });

// export const {
//   saveUser,
//   unsaveUser
// } = userSlice.actions;


// export const selectUser = (state: RootState) => state.user.user;

// export default userSlice.reducer;