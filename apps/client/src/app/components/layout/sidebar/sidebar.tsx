import React, { useState, useRef, useEffect, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoriesQuery } from '../../../hooks/useCategories';
import styles from './sidebar.module.scss';

type SidebarState = 'closed' | 'hover' | 'open';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useCategoriesQuery();

  const [sidebarState, setSidebarState] = useState<SidebarState>('closed');
  const [tooltipText, setTooltipText] = useState<string>('');
  const [tooltipTop, setTooltipTop] = useState<number>(0);
  const [isTooltipVisible, setIsTooltipVisible] = useState<boolean>(false);
  const [isSidebarAnimating, setIsSidebarAnimating] = useState<boolean>(false);

  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isSidebarAnimating && hoveredButtonRef.current) {
      const rect = hoveredButtonRef.current.getBoundingClientRect();
      setTooltipTop(rect.top + rect.height / 2);
      setIsTooltipVisible(true);
    }
  }, [isSidebarAnimating]);

  const handleCategoryClick = (id: string, index: number) => {
    if (index === 0) {
      navigate('/');
    } else {
      navigate(`/category/${id}`);
    }
  };

  const handleMouseEnterSidebar = () => {
    if (sidebarState === 'closed') setSidebarState('hover');
  };

  const handleMouseLeaveSidebar = () => {
    if (sidebarState === 'hover' || sidebarState === 'open') {
      setSidebarState('closed');
      setIsTooltipVisible(false);
      hoveredButtonRef.current = null;
      setIsSidebarAnimating(false);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    }
  };

  const handleClickSidebar = () => {
    if (sidebarState !== 'open') {
      setSidebarState('open');
      setIsSidebarAnimating(true);
      setIsTooltipVisible(false);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        setIsSidebarAnimating(false);
      }, 800);
    }
  };

  const handleMouseEnterButton = (e: MouseEvent<HTMLButtonElement>, title: string) => {
    hoveredButtonRef.current = e.currentTarget;
    setTooltipText(title);
    if (!isSidebarAnimating) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipTop(rect.top + rect.height / 2);
      setIsTooltipVisible(true);
    }
  };

  const handleMouseLeaveButton = () => {
    hoveredButtonRef.current = null;
    setIsTooltipVisible(false);
  };

  return (
    <>
      <nav
        className={`${styles['sidebar']} ${styles[sidebarState]}`}
        onMouseEnter={handleMouseEnterSidebar}
        onMouseLeave={handleMouseLeaveSidebar}
        onClick={handleClickSidebar}
      >
        <div className={styles['menu-content']}>
          <button
            className={styles['menu-button']}
            onClick={(e) => {
              e.stopPropagation();
              handleCategoryClick('', 0);
            }}
            onMouseEnter={(e) => handleMouseEnterButton(e, 'Всі категорії')}
            onMouseLeave={handleMouseLeaveButton}
          >
            Всі категорії
          </button>

          {!isLoading && categories.map((item, index) => (
            <button
              key={item.id}
              className={styles['menu-button']}
              onClick={(e) => {
                e.stopPropagation();
                handleCategoryClick(item.id, index + 1);
              }}
              onMouseEnter={(e) => handleMouseEnterButton(e, item.description)} 
            >
              {item.title}
            </button>
          ))}
        </div>
      </nav>

      <div
        className={`${styles['global-tooltip']} ${styles[isTooltipVisible ? 'visible' : '']} ${styles[sidebarState]}`}
        style={{ top: `${tooltipTop}px` }}
      >
        {tooltipText}
      </div>
    </>
  );
};

export default Sidebar;
