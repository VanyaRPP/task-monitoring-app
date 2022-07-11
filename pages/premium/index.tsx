import { Button } from 'antd'
import s from './style.module.scss'

const PremiumPage: React.FC = () => {
  return (
    <>
      <h1 className={s.Header}>Premium plans</h1>
      <p className={s.Text}>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque
        accusantium, id pariatur asperiores eaque voluptatum?
      </p>
      <div className={s.Container}>
        <div className={s.HalfBlock}>
          <h2>
            <b>Free</b>
          </h2>
          <h3>$0</h3>
          <p>Forever</p>
          <div className={s.Divider}></div>
          <p>Feature1</p>
          <p>Feature2</p>
          <p>Feature3</p>
          <p>Feature4</p>
          <Button type="primary" htmlType="submit" className={s.Click}>
            Get Plan
          </Button>
        </div>
        <div className={s.HalfBlock}>
          <h2>
            <b>Premium</b>
          </h2>
          <h3>$100</h3>
          <p>Forever</p>
          <div className={s.Divider}></div>
          <p>Feature1</p>
          <p>Feature2</p>
          <p>Feature3</p>
          <p>Feature4</p>
          <Button type="primary" htmlType="submit" className={s.Click}>
            Get Plan
          </Button>
        </div>
      </div>
    </>
  )
}

export default PremiumPage
