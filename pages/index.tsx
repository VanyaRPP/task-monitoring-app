import { Button, Space, DatePicker, Card } from 'antd';
import { CiCircleFilled } from '@ant-design/icons';
import { useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Loading from '../components/Loading';
import { useAppDispatch } from '../store/hooks';

import { useGetUserByEmailQuery } from '../api/userApi/user.api';


export default function Home() {
  const dispatch = useAppDispatch()
  const { data: session, status } = useSession()
  console.log('status', status);

  const { data, error, isLoading } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = data?.data
  
  return (
    <div>
      <Space
        direction="vertical"
        size="large"
      >
        <h1>Home</h1>
        <p>Helooo: {user?.name}</p>
        <p>
          site for search work
        </p>
      </Space>
    </div>
  );
}