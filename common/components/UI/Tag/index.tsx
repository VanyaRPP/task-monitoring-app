import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Divider, Tag } from 'antd';
import { FC, ReactElement } from 'react';
import { TaskStatuses } from '../../../../utils/constants';

interface Props {
  status: TaskStatuses | string
}

const getColorTag = (status): string => {
  switch (status) {
    case TaskStatuses.PENDING:
      return "#36cfc9"
    case TaskStatuses.PENDING_SELECTION:
      return "#36cfc9"
    case TaskStatuses.REJECTED:
      return "#a8071a"
    case TaskStatuses.IN_WORK:
      return "#096dd9"
    case TaskStatuses.EXPIRED:
      return "#002329"
    case TaskStatuses.COMPLETED:
      return "#389e0d"
    case TaskStatuses.ARCHIVED:
      return "#22075e"
    default:
      return "#d46b08"
  }
}
const getIconTag = (status): ReactElement => {
  switch (status) {
    case TaskStatuses.PENDING:
      return <ClockCircleOutlined />
    case TaskStatuses.PENDING_SELECTION:
      return <ClockCircleOutlined spin />
    case TaskStatuses.REJECTED:
      return <CloseCircleOutlined />
    case TaskStatuses.IN_WORK:
      return <SyncOutlined spin />
    case TaskStatuses.EXPIRED:
      return <MinusCircleOutlined />
    case TaskStatuses.COMPLETED:
      return <CheckCircleOutlined />
    case TaskStatuses.ARCHIVED:
      return <MinusCircleOutlined />
    default:
      return <PlusCircleOutlined spin />
  }
}

const StatusTag: FC<Props> = ({ status }) => (
  <>
    <Tag icon={getIconTag(status)} color={getColorTag(status)}>
      {status}
    </Tag>
  </>
);

export default StatusTag