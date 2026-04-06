import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiHeart } from "react-icons/fi";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { BsCloudDownload } from "react-icons/bs";
import type { ModelWithLikes, FileItem } from "@p3d-hub/shared-types";
import { useCategoriesQuery } from "../../hooks/useCategories";
import { useToggleLikeMutation } from "../../hooks/useModel";
import styles from './model-view.module.scss';

const TruncatableText: React.FC<{
  text: string;
  className?: string;
  isHeading?: boolean;
}> = ({ text, className = "", isHeading = false }) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    setIsTruncated(el.scrollWidth > el.clientWidth);
  };
  return isHeading ? (
    <h1 className={className} title={isTruncated ? text : undefined} onMouseEnter={handleMouseEnter}>{text}</h1>
  ) : (
    <span className={className} title={isTruncated ? text : undefined} onMouseEnter={handleMouseEnter}>{text}</span>
  );
};

interface ModelViewProps {
  model: ModelWithLikes;
  headerRight?: React.ReactNode;
}

const ModelView: React.FC<ModelViewProps> = ({ model, headerRight }) => {
  const { data: allCategories = [] } = useCategoriesQuery();
  const toggleLikeMutation = useToggleLikeMutation(model.id);

  const [isLiked, setIsLiked] = useState<boolean>(model.hasLiked);
  const [likesCount, setLikesCount] = useState<number>(model.likesCount);

  const gallery = [...model.files.gallery].sort((a, b) => a.order - b.order);
  const modelFiles = [...model.files.models].sort((a, b) => a.order - b.order);

  const [selectedPhoto, setSelectedPhoto] = useState<FileItem | null>(gallery[0] || null);

  const GAP = 8;
  const VISIBLE_COUNT = 5;
  const [startIndex, setStartIndex] = useState<number>(0);
  const [maskWidth, setMaskWidth] = useState<number>(0);
  const [translateX, setTranslateX] = useState<number>(0);

  const trackRef = useRef<HTMLDivElement>(null);

  const handleLikeToggle = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    toggleLikeMutation.mutate();
  };

  const updateDimensions = useCallback(() => {
    if (!trackRef.current || gallery.length === 0) return;

    const children = Array.from(trackRef.current.children) as HTMLElement[];
    if (children.length === 0) return;

    let currentTranslateX = 0;
    for (let i = 0; i < startIndex; i++) {
      currentTranslateX += children[i].offsetWidth + GAP;
    }
    setTranslateX(currentTranslateX);

    let currentMaskWidth = 0;
    const endIndex = Math.min(startIndex + VISIBLE_COUNT, children.length);
    for (let i = startIndex; i < endIndex; i++) {
      currentMaskWidth += children[i].offsetWidth;
      if (i > startIndex) currentMaskWidth += GAP;
    }
    setMaskWidth(currentMaskWidth);
  }, [startIndex, gallery.length]);

  useEffect(() => {
    if (!trackRef.current) return;
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(trackRef.current);
    Array.from(trackRef.current.children).forEach(c => observer.observe(c));
    return () => observer.disconnect();
  }, [updateDimensions, gallery.length]);

  useEffect(() => {
    updateDimensions();
  }, [startIndex, updateDimensions]);

  const handleNext = () => {
    if (startIndex + VISIBLE_COUNT < gallery.length) {
      setStartIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (startIndex > 0) {
      setStartIndex((prev) => prev - 1);
    }
  };

  const API_FILE_URL = import.meta.env.VITE_API_FILE_URL as string;

  return (
    <>
      <div className={styles['model-header-wrapper']}>
        <div className={styles['model-header-top']}>
          <div className={styles['model-title-container']}>
            <TruncatableText isHeading={true} className={styles['model-title']} text={model.title} />
          </div>
          {headerRight && (
            <div className={styles['header-right-action']}>
              {headerRight}
            </div>
          )}
        </div>

        <button
          className={`${styles['model-likes']} ${isLiked ? styles['liked'] : ''}`}
          onClick={handleLikeToggle}
          disabled={toggleLikeMutation.isPending}
        >
          <span className={styles['likes-count']}>[{likesCount}]</span>
          <FiHeart className={styles['heart-icon']} fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>

      <div style={{ width: '100%', marginBottom: '20px' }}>
        {selectedPhoto ? (
          <img className={styles['main-image']} src={`${API_FILE_URL}${selectedPhoto.filename}`} alt={selectedPhoto.originalName} />
        ) : (
          <div className={styles['main-image-placeholder']}>Немає фото</div>
        )}
      </div>

      <div className={`${styles['gallery-row']} ${gallery.length <= VISIBLE_COUNT ? styles['centered'] : ''}`}>
        {gallery.length > VISIBLE_COUNT && (
          <button className={styles['gallery-nav-btn']} onClick={handlePrev} disabled={startIndex === 0}>
            <IoIosArrowBack />
          </button>
        )}

        <div className={styles['gallery-mask-dynamic']} style={{ '--mask-width': `${maskWidth}px` } as React.CSSProperties}>
          <div ref={trackRef} className={styles['gallery-track-animated']} style={{ '--offset-x': `-${translateX}px` } as React.CSSProperties}>
            {gallery.map((photo) => (
              <div
                key={photo.filename}
                className={`${styles['thumb-placeholder']} ${selectedPhoto?.filename === photo.filename ? styles['active'] : ''}`}
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={`${API_FILE_URL}${photo.filename}`}
                  alt={photo.originalName}
                  className={styles['thumb-image']}
                  onLoad={updateDimensions}
                />
              </div>
            ))}
          </div>
        </div>

        {gallery.length > VISIBLE_COUNT && (
          <button className={styles['gallery-nav-btn']} onClick={handleNext} disabled={startIndex + VISIBLE_COUNT >= gallery.length}>
            <IoIosArrowForward />
          </button>
        )}
      </div>

      <p className={styles['description-text']}>{model.description}</p>

      <div className={styles['categories-row']}>
        <span className={styles['categories-label']}>Категорії:</span>
        <div className={styles['categories-list']}>
          {model.categoryIds.map(id => (
            <div key={id} className={styles['category-btn']}>
              {allCategories.find(c => c.id === id)?.title || id}
            </div>
          ))}
        </div>
      </div>

      <div className={styles['model-info-section']}>
        <div className={styles['model-details']}>
          <div className={styles['detail-item']}><span className={styles['detail-label']}>Розмір:</span><TruncatableText className={styles['detail-value']} text={model.size} /></div>
          <div className={styles['detail-item']}><span className={styles['detail-label']}>Матеріал:</span><TruncatableText className={styles['detail-value']} text={model.recommendedMaterial} /></div>
          <div className={styles['detail-item']}><span className={styles['detail-label']}>Час друку:</span><TruncatableText className={styles['detail-value']} text={`${model.estimatedPrintTime} хв`} /></div>
          <div className={styles['detail-item']}><span className={styles['detail-label']}>Об'єм:</span><TruncatableText className={styles['detail-value']} text={`${model.estimatedVolume} см³`} /></div>
          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>Комерційне використання:</span>
            <TruncatableText className={`${styles['commercial-status']} ${model.allowCommercialUse ? styles['allowed'] : styles['not-allowed']}`} text={model.allowCommercialUse ? "дозволено" : "не дозволено"} />
          </div>
        </div>

        <div className={styles['files-table']}>
          <div className={styles['table-header']}><div className={styles['th-left']}>Назва файлу</div><div className={styles['th-right']}>Дії</div></div>
          <div className={styles['table-body']}>
            {modelFiles.map(file => (
              <div key={file.filename} className={styles['file-row']}>
                <span className={styles['file-name-text']} title={file.originalName}>{file.originalName}</span>
                <a href={`${API_FILE_URL}${file.filename}`} download={file.originalName} target="_blank" rel="noreferrer" className={styles['file-action-btn']} title="Завантажити">
                  <BsCloudDownload />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModelView;
