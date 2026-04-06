import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import styles from "./model.module.scss";
import ModelView from "../../components/model-view/model-view";
import ModelEdit from "../../components/model-edit/model-edit";
import { useModelQuery } from "../../hooks/useModel";
import { useVerifyQuery } from "../../hooks/useAuth";
import { useUserLoginQuery } from "../../hooks/useUser";

const ModelPage: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isEditMode = location.pathname.endsWith("/edit");

  const { data: verifyData } = useVerifyQuery();
  const { data: currentModel, isLoading, isError } = useModelQuery(id || '');
  const { data: authorData } = useUserLoginQuery(currentModel?.authorId || '');

  if (isLoading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Завантаження моделі...</div>;
  }

  if (isError || !currentModel) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Модель не знайдено</div>;
  }

  const isOwner = verifyData?.userId === currentModel.authorId;

  const toggleMode = (mode: "VIEW" | "EDIT") => {
    if (mode === "EDIT") {
      navigate(`/model/${currentModel.id}/edit`);
    } else {
      navigate(`/model/${currentModel.id}`);
    }
  };

  const headerRightContent = isOwner ? (
    <div className={styles['mode-toggle']}>
      <div
        className={`${styles['toggle-indicator']} ${styles[isEditMode ? 'EDIT' : 'VIEW']}`}
      />
      <button
        className={`${styles['toggle-btn']}`}
        onClick={() => toggleMode('VIEW')}
      >
        VIEW
      </button>
      <button
        className={`${styles['toggle-btn']}`}
        onClick={() => toggleMode('EDIT')}
      >
        EDIT
      </button>
    </div>
  ) : (
    <div
      className={styles['author-name']}
      style={{ cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap' }}
      onClick={() => navigate(`/author-models/${currentModel.authorId}`)}
    >
      Автор: {authorData?.login || currentModel.authorId}
    </div>
  );

  return (
    <div className={styles['model-card']}>
      {!isEditMode ? (
        <ModelView model={currentModel} headerRight={headerRightContent} />
      ) : (
        <ModelEdit model={currentModel} headerRight={headerRightContent} />
      )}
    </div>
  );
};

export default ModelPage;
