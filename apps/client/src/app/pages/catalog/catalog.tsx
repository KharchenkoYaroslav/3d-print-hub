import React from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import styles from './catalog.module.scss';
import { FiHeart } from 'react-icons/fi';
import { VscAdd } from 'react-icons/vsc';
import { useCatalogModelsQuery, useModelsCountQuery, MODELS_QUERY_KEY } from '../../hooks/useModelsList';
import { useVerifyQuery } from '../../hooks/useAuth';
import { useProfileQuery } from '../../hooks/useUser';
import { useCreateModelMutation } from '../../hooks/useModel';

const ITEMS_PER_PAGE = 20;

const Catalog: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data: verifyData } = useVerifyQuery();
  const { data: profile } = useProfileQuery(verifyData?.userId || '');

  let categoryId: string | undefined = undefined;
  let authorId: string | undefined = undefined;

  if (location.pathname.startsWith('/category/') && id) {
    categoryId = decodeURIComponent(id);
  } else if (location.pathname.startsWith('/author-models/') && id) {
    authorId = id;
  }

  const isMyCollection = Boolean(verifyData?.userId && authorId === verifyData.userId);

  const { data: modelsCountData } = useModelsCountQuery(categoryId, authorId);
  const totalCount = modelsCountData?.count || 0;
  const effectiveTotalCount = isMyCollection ? totalCount + 1 : totalCount;
  const totalPages = Math.ceil(effectiveTotalCount / ITEMS_PER_PAGE) || 1;

  const createModelMutation = useCreateModelMutation();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = currentPage * ITEMS_PER_PAGE - 1;

  const isLastPage = currentPage === totalPages;

  const { data: models = [], isLoading } = useCatalogModelsQuery(from, to, categoryId, authorId);
  const API_FILE_URL = import.meta.env.VITE_API_FILE_URL as string;

  const handleCreateModel = () => {
    if (!profile?.login || modelsCountData === undefined) return;

    const nextCount = totalCount + 1;
    const newTitle = `${profile.login}'s ${nextCount} model`.toUpperCase();

    createModelMutation.mutate(
      { title: newTitle },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [MODELS_QUERY_KEY] });
        },
      }
    );
  };

  if (isLoading) {
    return <div className={styles['loading-text']}>Завантаження моделей...</div>;
  }

  return (
    <div className={styles['catalog-grid']}>
      {models.map((item) => (
        <div key={item.id} className={styles['catalog-card']} onClick={() => navigate(`/model/${item.id}`)}>
          <div className={styles['catalog-card-header']}>
            <span className={styles['catalog-card-likes']}>[{item.likes}]</span>
            <FiHeart className={styles['catalog-card-icon']} fill="currentColor" />
          </div>
          <div className={styles['catalog-card-rectangle']}>
             {item.cover ? (
               <img
                 src={`${API_FILE_URL}${item.cover.filename}`}
                 alt={item.cover.originalName}
                 className={styles['catalog-card-image']}
               />
             ) : null}
          </div>
          <div className={styles['catalog-card-footer']}>
            <span className={styles['catalog-card-name']}>{item.title}</span>
          </div>
        </div>
      ))}

      {isMyCollection && isLastPage && (
        <div
          className={`${styles['catalog-card']} ${styles['add-new-card']} ${createModelMutation.isPending ? styles['pending'] : ''}`}
          onClick={handleCreateModel}
        >
           <div className={styles['add-button-circle']}>
             <VscAdd size={40} />
           </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
