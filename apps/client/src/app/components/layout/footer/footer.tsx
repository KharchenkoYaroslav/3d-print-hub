import React, { type ReactNode } from 'react';
import { FaGithub } from 'react-icons/fa';
import kpiLogo from '../../../../assets/shield-kpi-white.png';
import styles from './footer.module.scss';

interface FooterProps {
  centerContent?: ReactNode;
}

const Footer: React.FC<FooterProps> = ({ centerContent }) => {
  return (
    <footer className={styles['footer-container']}>
      <div className={styles['footer-left']}>
        <a
          href="https://github.com/KharchenkoYaroslav"
          target="_blank"
          rel="noopener noreferrer"
          className={styles['author-text']}
        >
          Made by KharchenkoYaroslav <FaGithub className={styles['github-icon']} />
        </a>
      </div>

      <div className={styles['footer-center']}>
        {centerContent}
      </div>

      <div className={styles['footer-right']}>
        <img src={kpiLogo} alt="KPI Logo" className={styles['kpi-logo']} />
      </div>
    </footer>
  );
};

export default Footer;
