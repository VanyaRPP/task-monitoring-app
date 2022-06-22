import { Card } from 'antd'
import s from './style.module.scss'


const Tasks: React.FC = () => {
    return (
        <div className={s.Container}>
            <Card title='Fix some shit' extra={<a href="#">More</a>} className={s.Card}>
                <p>Catagory: Some category</p>
                <p>Description: I don`t know how but I need you to do this task</p>
                <p>Domain: some area</p>
                <p>Deadline: 09.10.2022</p>
            </Card>
        </div>
    )
}

export default Tasks