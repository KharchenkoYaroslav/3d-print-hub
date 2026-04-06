import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import styles from './app.module.scss';

import Header from './components/layout/header/header';
import Sidebar from './components/layout/sidebar/sidebar';
import Footer from './components/layout/footer/footer';
import ProfileModal from './components/profile/profile-modal';
import Pagination from './components/pagination/pagination';

import { useCategoriesQuery } from './hooks/useCategories';
import { useUserLoginQuery } from './hooks/useUser';

const App: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const location = useLocation();

  const { data: categories } = useCategoriesQuery();

  const authorMatch = location.pathname.match(/\/author-models\/(.+)/);
  const authorId = authorMatch ? authorMatch[1] : '';
  const { data: authorData } = useUserLoginQuery(authorId);

  const toggleProfile = (): void => {
    setIsProfileOpen(!isProfileOpen);
  };


  const isCatalogRoute =
    location.pathname === '/' ||
    location.pathname.startsWith('/category/') ||
    location.pathname.startsWith('/author-models/');

  let headerCategoryName = "Всі категорії";

  if (location.pathname.startsWith('/category/')) {
    const categoryId = decodeURIComponent(location.pathname.split('/category/')[1]);
    const category = categories?.find(c => c.id === categoryId);
    headerCategoryName = category ? category.title : categoryId;
  } else if (location.pathname.startsWith('/author-models/')) {
    headerCategoryName = authorData?.login ? `Колекція: ${authorData.login}` : "Колекція автора";
  } else if (location.pathname.startsWith('/model/')) {
    headerCategoryName = "Перегляд моделі";
  }

  return (
    <div className={styles['app-layout']}>
      <div className={styles['main-container']}>
        <Header categoryName={headerCategoryName} onToggleProfile={toggleProfile} />

        <Outlet />

        <Footer centerContent={isCatalogRoute ? <Pagination /> : null} />
      </div>

      <Sidebar />
      <ProfileModal isOpen={isProfileOpen} onClose={toggleProfile} />
    </div>
  );
};

export default App;
