import { useState } from 'react';
import { Button } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import styles from './styled.module.scss';

interface FullScreenWrapperProps {
  children: React.ReactNode;
}

const FullScreenWrapper: React.FC<FullScreenWrapperProps> = ({ children }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <>
      <Button 
        className={styles.toggleButton}
        onClick={toggleFullScreen}
        type="default"
        icon={isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
      />
      <div className={`${styles.contentWrapper} ${isFullScreen ? styles.fullScreen : ''}`}>
        {children}
      </div>
    </>
  );
};

export default FullScreenWrapper;