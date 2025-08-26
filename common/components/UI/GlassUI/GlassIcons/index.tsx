import React, { useState } from "react";
import s from './style.module.scss';
import { GlassButton } from '@components/UI/GlassUI';
import {
  HomeOutlined,
  MailOutlined,
  PhoneOutlined, 
} from '@ant-design/icons'

export interface GlassIconsItem {
  icon: React.ReactElement;
  color: string;
  label: string;
  href?: string;
  customClass?: string;
}

export interface GlassIconsProps {
  items: GlassIconsItem[];
  className?: string;
}

const gradientMapping: Record<string, string> = {};

const GlassIcons: React.FC<GlassIconsProps> = ({ items, className }) => {
  const [showModal, setShowModal] = useState(false);

  const getBackgroundStyle = (color: string): React.CSSProperties => {
    if (gradientMapping[color]) {
      return { background: null };
    }
    return { background: null };
  };

  const handleClick = (label: string) => {
    if (label === 'Контакти') {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className={`${s['icon-btns']} ${className || ''}`}>
        {items.map((item, index) => {
          const Tag = item.href ? 'a' : 'button';
          return (
            <Tag
              key={index}
              href={item.href}
              target={item.href ? '_blank' : undefined}
              rel={item.href ? 'noopener noreferrer' : undefined}
              type={Tag === 'button' ? 'button' : undefined}
              className={`${s['icon-btn']} ${item.customClass ? s[item.customClass] : ''} ${item.label === 'Контакти' ? s.ContactButton : ''}`}
              aria-label={item.label}
              onClick={() => handleClick(item.label)}
            >
              <span className={s['icon-btn__back']} style={getBackgroundStyle(item.color)}></span>
              <span className={s['icon-btn__front']}>
                <span className={s['icon-btn__icon']} aria-hidden="true">
                  {item.icon}
                </span>
              </span>
              <span className={s['icon-btn__label']}>{item.label}</span>
            </Tag>
          );
        })}
      </div>

      {showModal && (
  <div className={s.modalOverlay}>
    <div
      className={s.modalContent}
      style={{
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingLeft:'30px',
          gap: '20px',
          textAlign: 'left',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <h3 className={s.ModalName}>Контакти Spacehub:</h3>

        <p>
          <a
            href="https://www.google.com/maps?q=Мала+Бердичівська+17б,+Житомир"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              cursor: 'pointer',
              color: 'white',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'underline',
            }}
          >
            <HomeOutlined style={{ marginRight: '8px' }} className={s.ContactAdressGoogle} />
            Мала Бердичівська 17б, Житомир
          </a>
        </p>

        <p>
          <span
            className={s.MailName}
            onClick={() => navigator.clipboard.writeText('mail@spacehub.in.ua')}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'underline'
            }}
          >
            <MailOutlined style={{ marginRight: '8px' }} />
            mail@spacehub.in.ua
          </span>
        </p>

        <p>
          <span
            onClick={() => navigator.clipboard.writeText('+38(073)-777-5242')}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <PhoneOutlined style={{ marginRight: '8px' }} />
            +38(073)-777-5242
          </span>
        </p>

        <div style={{
        display: 'flex',
        justifyContent: 'center',
        paddingRight:'40px',
        color:'white'
      }}>
          <GlassButton 
          className={s.ClouseButton}
      onClick={() => setShowModal(false)}>Закрити</GlassButton>
        </div>
      </div>
    </div>
  </div>
)}

    </>
  );
};

export default GlassIcons;
