// import { useRouter } from "next/router";
// import { selectUser } from "../features/user/userSlice";
// import { useAppSelector } from "../store/hooks";

// const withAuth = Component => {
//   const Auth = (props) => {

//     const router = useRouter()
//     const user = useAppSelector(selectUser)
//     // Login data added to props via redux-store (or use react context for example)
//     const isLoggedIn = user

//     // If user is not logged in, return login component
//     if (!isLoggedIn) {
//       return (
//         router.push('/')
//       );
//     }

//     // If user is logged in, return original component
//     return (
//       <Component {...props} />
//     );
//   };

//   // // Copy getInitial props so it will run as well
//   // if (Component.getInitialProps) {
//   //   Auth.getInitialProps = Component.getInitialProps;
//   // }

//   // return Auth;
// };

// export default withAuth;