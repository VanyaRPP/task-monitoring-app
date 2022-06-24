import { Button, Card, message } from 'antd'
import { useState } from 'react'
import { useGetAllTaskQuery } from '../../api/taskApi/task.api'
import withAuthRedirect from '../../components/HOC/withAuthRedirect'
import s from './style.module.scss'
import { ITask } from '../../models/Task'
import { DeleteOutlined } from '@ant-design/icons'
import moment from 'moment'

const Tasks: React.FC = () => {

    const { data } = useGetAllTaskQuery('')

    const tasks = data?.data

    return (
        <div className={s.Container}>
            {
                tasks && tasks.map((task: ITask, index) => {
                    return <Card
                        key={index}
                        title={task.name}
                        extra={<Button
                            ghost
                            danger
                            onClick={() => console.log('aplly')}>
                            Apply
                        </Button>}
                        className={s.Card}>
                        <p>Catagory: Some category</p>
                        <p>Description: {task.desription}</p>
                        <p>Domain: some area</p>
                        <p>DeadLine: {moment(task?.deadline).format("MMM Do YY")}</p>
                        <Button
                            className={s.Delete}
                            onClick={() => console.log('delete')}
                            ghost
                            danger>
                            <DeleteOutlined />
                        </Button>
                    </Card>
                })
            }
        </div>
    )
}

export default withAuthRedirect(Tasks)
