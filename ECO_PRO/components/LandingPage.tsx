import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const { t } = useLanguage();
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: 'rgb(var(--color-bg-main))',
      backgroundImage: 'radial-gradient(circle at top right, rgba(var(--color-primary), 0.1), transparent 40%), radial-gradient(circle at bottom left, rgba(var(--color-secondary), 0.1), transparent 40%)',
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: 'rgb(var(--color-light))',
      overflow: 'hidden',
      padding: '4vw'
    }}>
      <div style={{
        textShadow: '2px 2px 8px rgba(0, 0, 0, 0.7)'
      }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
          fontWeight: 900,
          margin: 0,
          lineHeight: 1,
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          IMPÉRIO LOG
        </h1>
        <p style={{
          fontSize: 'clamp(1.2rem, 4vw, 1.75rem)',
          fontWeight: 300,
          margin: '1rem 0',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }}>
          {t('managementSystem')}
        </p>
        <p style={{
          fontSize: 'clamp(1rem, 3.5vw, 1.5rem)',
          fontWeight: 700,
          margin: '0 0 2rem 0',
          letterSpacing: '0.05em',
          color: 'rgb(var(--color-gray-text))'
        }}>
          ECO<span style={{color: 'rgb(var(--color-primary))'}}>.</span>LOG
        </p>
        <button 
          onClick={onEnter} 
          style={{
            padding: '1rem 2.5rem',
            fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
            fontWeight: 'bold',
            color: 'rgb(var(--color-light))',
            backgroundColor: 'transparent',
            border: '2px solid rgb(var(--color-primary))',
            borderRadius: '50px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(var(--color-primary))';
              e.currentTarget.style.color = 'rgb(var(--color-bg-main))';
          }}
          onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgb(var(--color-light))';
          }}
        >
          {t('enter')}
        </button>
      </div>
    </div>
  );
};

export default LandingPage;