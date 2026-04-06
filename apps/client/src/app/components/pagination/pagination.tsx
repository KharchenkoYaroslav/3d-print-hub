import React from 'react';
import { useSearchParams, useLocation, useParams } from 'react-router-dom';
import { useModelsCountQuery } from '../../hooks/useModelsList';
import { useVerifyQuery } from '../../hooks/useAuth';
import styles from './pagination.module.scss';

const ITEMS_PER_PAGE = 20;

const Pagination: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { id } = useParams();

  const { data: verifyData } = useVerifyQuery();

  let categoryId = undefined;
  let authorId = undefined;

  if (location.pathname.startsWith('/category/') && id) {
    categoryId = decodeURIComponent(id);
  } else if (location.pathname.startsWith('/author-models/') && id) {
    authorId = id;
  }

  const isMyCollection = Boolean(verifyData?.userId && authorId === verifyData.userId);

  const { data } = useModelsCountQuery(categoryId, authorId);
  const totalCount = data?.count || 0;
  const effectiveTotalCount = isMyCollection ? totalCount + 1 : totalCount;
  const totalPages = Math.ceil(effectiveTotalCount / ITEMS_PER_PAGE);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers.map((page, index) => {
      if (page === '...') {
        return (
          <button key={`dots-${index}`} className={`${styles['page-item']} ${styles['dots']}`} disabled>
            ...
          </button>
        );
      }
      return (
        <button
          key={page}
          className={`${styles['page-item']} ${currentPage === page ? styles['active'] : ''}`}
          onClick={() => handlePageChange(page as number)}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className={styles['pagination']}>
      <button
        className={styles['page-control']}
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
      >«</button>
      <button
        className={styles['page-control']}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >‹</button>

      {renderPageNumbers()}

      <button
        className={styles['page-control']}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >›</button>
      <button
        className={styles['page-control']}
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
      >»</button>
    </div>
  );
};

export default Pagination;
