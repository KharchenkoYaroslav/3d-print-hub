import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsTrash, BsArrowUp, BsArrowDown, BsArrowLeft, BsArrowRight, BsX } from 'react-icons/bs';
import type { ModelWithLikes, FileItem, UpdateModelParams } from '@p3d-hub/shared-types';
import { useCategoriesQuery } from '../../hooks/useCategories';
import { useVerifyQuery } from '../../hooks/useAuth';
import {
  useUpdateModelParamsMutation,
  useUploadModelFileMutation,
  useUpdateCategoriesMutation,
  useUploadGalleryPhotoMutation,
  useDeleteGalleryPhotoMutation,
  useDeleteModelFileMutation,
  useReorderFilesMutation,
  useDeleteModelMutation
} from '../../hooks/useModel';
import styles from './model-edit.module.scss';

interface ModelEditProps {
  model: ModelWithLikes;
  headerRight?: React.ReactNode;
}

const ModelEdit: React.FC<ModelEditProps> = ({ model, headerRight }) => {
  const navigate = useNavigate();
  const { data: verifyData } = useVerifyQuery();
  const { data: allCategories = [] } = useCategoriesQuery();

  const { mutate: updateParams } = useUpdateModelParamsMutation(model.id);
  const uploadFileMutation = useUploadModelFileMutation(model.id);
  const updateCategoriesMutation = useUpdateCategoriesMutation(model.id);
  const uploadPhotoMutation = useUploadGalleryPhotoMutation(model.id);
  const deletePhotoMutation = useDeleteGalleryPhotoMutation(model.id);
  const deleteFileMutation = useDeleteModelFileMutation(model.id);
  const reorderMutation = useReorderFilesMutation(model.id);
  const deleteModelMutation = useDeleteModelMutation();

  const [title, setTitle] = useState<string>(model.title);
  const [gallery, setGallery] = useState<FileItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>(model.categoryIds);
  const [description, setDescription] = useState<string>(model.description);
  const [size, setSize] = useState<string>(model.size);
  const [material, setMaterial] = useState<string>(model.recommendedMaterial);
  const [printTime, setPrintTime] = useState<number>(model.estimatedPrintTime);
  const [volume, setVolume] = useState<number>(model.estimatedVolume);
  const [allowCommercialUse, setAllowCommercialUse] = useState<boolean>(model.allowCommercialUse);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const API_FILE_URL = import.meta.env.VITE_API_FILE_URL as string;

  const isDeleteMatched = deleteInput.trim() === model.title.trim();

  const handleDeleteModel = () => {
    if (isDeleteMatched) {
      deleteModelMutation.mutate(model.id, {
        onSuccess: () => {
          const targetUserId = verifyData?.userId || model.authorId;
          navigate(`/author-models/${targetUserId}`);
        }
      });
    }
  };

  const handleCancelDelete = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowDeleteConfirm(false);
      setIsClosing(false);
      setDeleteInput('');
    }, 300);
  };

  useEffect(() => {
    setGallery([...model.files.gallery].sort((a,b) => a.order - b.order));
    setFiles([...model.files.models].sort((a,b) => a.order - b.order));
  }, [model.files]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const currentParams: UpdateModelParams = {
        title,
        description,
        size,
        recommendedMaterial: material,
        estimatedPrintTime: printTime,
        estimatedVolume: volume,
        allowCommercialUse,
      };

      const hasChanges =
        title !== model.title ||
        description !== model.description ||
        size !== model.size ||
        material !== model.recommendedMaterial ||
        printTime !== model.estimatedPrintTime ||
        volume !== model.estimatedVolume ||
        allowCommercialUse !== model.allowCommercialUse;

      if (hasChanges) {
        updateParams(currentParams);
      }

    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [
    title, description, size, material, printTime, volume, allowCommercialUse,
    model.title, model.description, model.size, model.recommendedMaterial,
    model.estimatedPrintTime, model.estimatedVolume, model.allowCommercialUse,
    updateParams
  ]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerPhotoInput = () => {
    photoInputRef.current?.click();
  };

  const handleDeletePhoto = (filename: string) => {
    deletePhotoMutation.mutate(filename);
    setGallery(gallery.filter(p => p.filename !== filename).map((p, i) => ({ ...p, order: i })));
  };

  const handleMovePhoto = (index: number, direction: 'left' | 'right') => {
    const newGallery = [...gallery];
    if (direction === 'left' && index > 0) {
      [newGallery[index - 1], newGallery[index]] = [newGallery[index], newGallery[index - 1]];
    } else if (direction === 'right' && index < gallery.length - 1) {
      [newGallery[index + 1], newGallery[index]] = [newGallery[index], newGallery[index + 1]];
    }

    const newOrderForBackend = newGallery.map(f => f.order);
    const reordered = newGallery.map((item, i) => ({ ...item, order: i }));
    setGallery(reordered);
    reorderMutation.mutate({ target: 'gallery', newOrder: newOrderForBackend });
  };

  const handleDeleteFile = (filename: string) => {
    deleteFileMutation.mutate(filename);
    setFiles(files.filter(f => f.filename !== filename).map((f, i) => ({ ...f, order: i })));
  };

  const handleMoveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    if (direction === 'up' && index > 0) {
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    } else if (direction === 'down' && index < files.length - 1) {
      [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
    }

    const newOrderForBackend = newFiles.map(f => f.order);
    const reordered = newFiles.map((item, i) => ({ ...item, order: i }));
    setFiles(reordered);
    reorderMutation.mutate({ target: 'models', newOrder: newOrderForBackend });
  };

  const handleAddCategory = (catId: string) => {
    if (catId && !categoryIds.includes(catId)) {
      const updated = [...categoryIds, catId];
      setCategoryIds(updated);
      setIsDropdownOpen(false);
      updateCategoriesMutation.mutate(updated);
    }
  };

  const handleRemoveCategory = (catIdToRemove: string) => {
    const updated = categoryIds.filter(c => c !== catIdToRemove);
    setCategoryIds(updated);
    updateCategoriesMutation.mutate(updated);
  };

  const availableOptions = allCategories.filter(c => !categoryIds.includes(c.id));

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoSelect}
      />

      <div className={styles['model-header-wrapper']}>
        <div className={styles['model-header-top']}>
          <div className={styles['model-title-container']}>
            <input
              className={styles['model-title-input']}
              type="text"
              value={title}
              placeholder="Введіть назву моделі..."
              onChange={(e) => setTitle(e.target.value.toUpperCase())}
            />
          </div>
          {headerRight && (
            <div className={styles['header-right-action']}>
              {headerRight}
            </div>
          )}
        </div>
      </div>

      <div className={styles['edit-section-block']}>
        <span className={styles['categories-label']}>Фото:</span>
        <div className={styles['edit-photos-grid']}>
          {gallery.map((photo, index) => (
            <div key={photo.filename} className={styles['edit-photo-card']}>
              <div className={styles['edit-photo-preview']}>
                <img src={`${API_FILE_URL}${photo.filename}`} alt={photo.originalName} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                {index === 0 && <span className={styles['main-photo-badge']}>ГОЛОВНЕ</span>}
              </div>
              <div className={styles['edit-photo-controls']}>
                <button className={styles['file-action-btn']} onClick={() => handleMovePhoto(index, 'left')} disabled={index === 0}><BsArrowLeft /></button>
                <button className={`${styles['file-action-btn']} ${styles['delete']}`} onClick={() => handleDeletePhoto(photo.filename)}><BsTrash /></button>
                <button className={styles['file-action-btn']} onClick={() => handleMovePhoto(index, 'right')} disabled={index === gallery.length - 1}><BsArrowRight /></button>
              </div>
            </div>
          ))}
          <div className={styles['add-photo-placeholder']} onClick={triggerPhotoInput}>
            <span>{uploadPhotoMutation.isPending ? 'ЗАВАНТАЖЕННЯ...' : '+ ЗАВАНТАЖИТИ\nНОВЕ ФОТО'}</span>
          </div>
        </div>
      </div>

      <div className={styles['edit-section-block']}>
        <span className={styles['categories-label']}>Опис:</span>
        <textarea
          className={styles['edit-textarea']}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className={styles['categories-row']}>
        <span className={styles['categories-label']}>Категорії:</span>
        <div className={styles['categories-list']}>
          {categoryIds.map((catId) => {
             const catObj = allCategories.find(c => c.id === catId);
             return (
              <div key={catId} className={`${styles['category-btn']} ${styles['edit-category-tag']}`}>
                <span>{catObj ? catObj.title : catId}</span>
                <button className={styles['remove-category-btn']} onClick={() => handleRemoveCategory(catId)} title="Видалити категорію"><BsX /></button>
              </div>
            );
          })}
          {availableOptions.length > 0 && (
            <div className={styles['custom-dropdown-container']}>
              <button className={`${styles['category-btn']} ${styles['category-add-btn']}`} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                + Додати категорію
              </button>
              {isDropdownOpen && (
                <div className={styles['custom-dropdown-menu']}>
                  {availableOptions.map(cat => (
                    <button key={cat.id} className={styles['custom-dropdown-item']} onClick={() => handleAddCategory(cat.id)}>
                      {cat.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles['model-info-section']}>
        <div className={styles['model-details']}>
          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>Розмір:</span>
            <input className={styles['edit-input']} type="text" value={size} onChange={(e) => setSize(e.target.value)} />
          </div>
          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>Рекомендований матеріал:</span>
            <input className={styles['edit-input']} type="text" value={material} onChange={(e) => setMaterial(e.target.value)} />
          </div>
          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>Орієнтовний час друку:</span>
            <div className={styles['input-with-unit']}>
              <input className={`${styles['edit-input']} ${styles['number-input']}`} type="number" value={printTime} min={0} onChange={(e) => setPrintTime(Number(e.target.value))} />
              <span className={styles['unit-text']}>хв</span>
            </div>
          </div>
          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>Орієнтовний об'єм:</span>
            <div className={styles['input-with-unit']}>
              <input className={`${styles['edit-input']} ${styles['number-input']}`} type="number" value={volume} min={0} onChange={(e) => setVolume(Number(e.target.value))} />
              <span className={styles['unit-text']}>см³</span>
            </div>
          </div>
          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>Комерційне використання:</span>
            <label className={styles['checkbox-label']}>
              <input className={styles['edit-checkbox']} type="checkbox" checked={allowCommercialUse} onChange={(e) => setAllowCommercialUse(e.target.checked)} />
              <span className={`${styles['commercial-status']} ${allowCommercialUse ? styles['allowed'] : styles['not-allowed']}`}>
                {allowCommercialUse ? 'Дозволено' : 'Не дозволено'}
              </span>
            </label>
          </div>
        </div>

        <div className={styles['files-table']}>
          <div className={styles['table-header']}><div className={styles['th-left']}>Назва файлу</div><div className={styles['th-right']}>Дії</div></div>
          <div className={styles['table-body']}>
            {files.map((file, index) => (
              <div key={file.filename} className={styles['file-row']}>
                <span className={styles['file-name-text']} title={file.originalName}>{file.originalName}</span>
                <div className={styles['file-actions-group']}>
                  <button className={styles['file-action-btn']} onClick={() => handleMoveFile(index, 'up')} disabled={index === 0}><BsArrowUp /></button>
                  <button className={styles['file-action-btn']} onClick={() => handleMoveFile(index, 'down')} disabled={index === files.length - 1}><BsArrowDown /></button>
                  <button className={`${styles['file-action-btn']} ${styles['delete']}`} onClick={() => handleDeleteFile(file.filename)}><BsTrash /></button>
                </div>
              </div>
            ))}
          </div>
          <div className={styles['file-row']}>
            <button className={styles['upload-file-btn']} onClick={triggerFileInput}>
              {uploadFileMutation.isPending ? 'Завантаження...' : '+ Додати файл'}
            </button>
          </div>
        </div>
      </div>

      <div className={styles['danger-zone']}>
        <span className={styles['danger-label']}>Небезпечна зона</span>

        {!showDeleteConfirm ? (
          <button
            className={styles['delete-main-btn']}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Видалити модель
          </button>
        ) : (
          <div className={`${styles['confirmation-panel']} ${isClosing ? styles['closing'] : ''}`}>
            <p className={styles['confirmation-text']}>
              Ця дія є незворотною. Щоб підтвердити видалення, введіть назву моделі: <strong>{model.title}</strong>
            </p>
            <div className={styles['confirmation-row']}>
              <input
                type="text"
                className={styles['confirm-input']}
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Введіть назву для підтвердження..."
                disabled={isClosing}
              />
              <div className={styles['confirm-actions']}>
                <button
                  className={styles['confirm-btn']}
                  disabled={!isDeleteMatched || deleteModelMutation.isPending || isClosing}
                  onClick={handleDeleteModel}
                >
                  {deleteModelMutation.isPending ? 'Видалення...' : 'Підтвердити видалення'}
                </button>
                <button
                  className={styles['cancel-btn']}
                  onClick={handleCancelDelete}
                  disabled={deleteModelMutation.isPending || isClosing}
                >
                  Відмінити
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ModelEdit;
