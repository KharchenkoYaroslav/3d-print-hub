import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { VscNewCollection } from 'react-icons/vsc';
import { CgProfile } from 'react-icons/cg';
import { useVerifyQuery } from '../../../hooks/useAuth';
import styles from './header.module.scss';

interface HeaderProps {
  categoryName?: string;
  onToggleProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ categoryName = "Всі категорії", onToggleProfile }) => {
  const navigate = useNavigate();
  const { data: verifyData } = useVerifyQuery();

  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(true);
  const lastScrollY = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);

      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles['header-container']} ${isScrolled ? styles['scrolled'] : ''} ${!isHeaderVisible ? styles['hidden'] : ''}`}>
      <div className={styles['header-left']}>
        <h1
          className={styles['title-3d-print-hub']}
          onClick={() => navigate('/')}
        >
          3D Print Hub
        </h1>
        <div className={styles['category-text']}>{categoryName}</div>
      </div>

      <div className={styles['header-center']}></div>

      <div className={styles['header-right']}>
        <div
          className={styles['circle-icon']}
          onClick={() => {
            if (verifyData?.userId) {
              navigate(`/author-models/${verifyData.userId}`);
            }
          }}
          title="Мої колекції"
        >
          <VscNewCollection />
        </div>
        <div className={styles['circle-icon']} onClick={onToggleProfile} title="Профіль">
          <CgProfile />
        </div>
      </div>
    </header>
  );
};

export default Header;
