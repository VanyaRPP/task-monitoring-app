import { FC } from "react"
import Container from "../../../components/UI/Container"
import s from './style.module.sass'

const LoginPage: FC = () => {
  return (
    <Container row={false}>
      <div className={s.HalfBlock}>
        <h1>Login</h1>
      </div>
      <div className={s.HalfBlock}>
        <h2>
          Немає облікового запису?
          Приєднуйтесь до нас!
        </h2>
      </div>
    </Container>
  )
}

export default LoginPage