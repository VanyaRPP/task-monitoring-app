import React, { useState } from 'react';
import { Steps, ConfigProvider } from 'antd';

const items = [
  {
            title: 'Step 1',
            description: '...',
          },
          {
            title: 'Step 2',
            description: '...',
          },
          {
            title: 'Step 3',
            description: '...',
          },
];

const MainMenuSteps: React.FC = () => {
  const [current, setCurrent] = useState(0);

  return (
    <div>
      <ConfigProvider>
        <Steps current={current} items={items} onChange={setCurrent} status='finish' />
      </ConfigProvider>
    </div>
  );
};

export default MainMenuSteps;
