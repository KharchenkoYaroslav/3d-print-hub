import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { MdEdit, MdOutlinePassword } from 'react-icons/md';
import { isAxiosError } from 'axios';
import type { UpdateUser } from '@p3d-hub/shared-types';
import { useVerifyQuery } from '../../hooks/useAuth';
import { useProfileQuery, useDeleteProfileMutation, useUpdateProfileMutation } from '../../hooks/useUser';
import { useAuthContext } from '../../providers/AuthProvider';
import styles from './profile-modal.module.scss';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuthContext();
  const { data: verifyData } = useVerifyQuery();
  const { data: profile, isLoading } = useProfileQuery(verifyData?.userId || '');
  const deleteProfileMutation = useDeleteProfileMutation();
  const updateProfileMutation = useUpdateProfileMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteInput, setDeleteInput] = useState<string>('');
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const [editMode, setEditMode] = useState<'login' | 'password' | null>(null);
  const [isEditClosing, setIsEditClosing] = useState<boolean>(false);
  const [newLogin, setNewLogin] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [editError, setEditError] = useState<string>('');

  if (!isOpen) return null;

  const isDeleteMatched = profile && deleteInput.trim() === profile.login.trim();

  const handleDeleteAccount = () => {
    if (isDeleteMatched) {
      deleteProfileMutation.mutate(undefined, {
        onSuccess: () => {
          logout();
          onClose();
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

  const toggleEditMode = (mode: 'login' | 'password') => {
    if (editMode === mode) {
      handleCancelEdit();
    } else {
      setEditMode(mode);
      setEditError('');
      setCurrentPassword('');
      if (mode === 'login' && profile) setNewLogin(profile.login);
      if (mode === 'password') setNewPassword('');
    }
  };

  const handleCancelEdit = () => {
    setIsEditClosing(true);
    setTimeout(() => {
      setEditMode(null);
      setIsEditClosing(false);
      setEditError('');
    }, 300);
  };

  const handleSaveEdit = () => {
    if (!currentPassword) {
      setEditError('Введіть поточний пароль для підтвердження');
      return;
    }

    const payload: UpdateUser = {
      currentPassword: currentPassword
    };

    if (editMode === 'login') {
      if (!newLogin || newLogin === profile?.login) {
         setEditError('Введіть новий логін');
         return;
      }
      payload.login = newLogin;
    } else if (editMode === 'password') {
      if (!newPassword) {
         setEditError('Введіть новий пароль');
         return;
      }
      payload.password = newPassword;
    }

    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        handleCancelEdit();
      },
      onError: (err: unknown) => {
         if (isAxiosError(err) && err.response?.data?.message) {
            setEditError(err.response.data.message);
         } else {
            setEditError('Виникла помилка при оновленні даних');
         }
      }
    });
  };

  return (
    <div className={styles['profile-overlay']}>
      <div className={styles['profile-modal']}>
        <IoClose className={styles['profile-close']} onClick={onClose} />
        <div className={styles['profile-content']}>
          <h2>Мій профіль</h2>

          {isLoading ? (
            <p style={{ textAlign: 'center' }}>Завантаження...</p>
          ) : profile ? (
            <>
              <div className={styles['profile-info-box']}>
                <div className={styles['profile-info-header']}>
                  <strong>Логін:</strong>&nbsp;{profile.login}
                  <div className={styles['profile-icons']}>
                    <MdEdit
                      className={`${styles['profile-action-icon']} ${editMode === 'login' ? styles['active'] : ''}`}
                      title="Змінити логін"
                      onClick={() => toggleEditMode('login')}
                    />
                    <MdOutlinePassword
                      className={`${styles['profile-action-icon']} ${editMode === 'password' ? styles['active'] : ''}`}
                      title="Змінити пароль"
                      onClick={() => toggleEditMode('password')}
                    />
                  </div>
                </div>

                {editMode && (
                  <div className={`${styles['edit-panel']} ${isEditClosing ? styles['closing'] : ''}`}>
                    {editError && <div className={styles['edit-error']}>{editError}</div>}

                    {editMode === 'login' && (
                      <div className={styles['edit-input-group']}>
                        <label>Новий логін</label>
                        <input
                          type="text"
                          className={styles['edit-input']}
                          value={newLogin}
                          onChange={(e) => setNewLogin(e.target.value)}
                          disabled={updateProfileMutation.isPending || isEditClosing}
                          placeholder="Введіть новий логін"
                        />
                      </div>
                    )}

                    {editMode === 'password' && (
                      <div className={styles['edit-input-group']}>
                        <label>Новий пароль</label>
                        <input
                          type="password"
                          className={styles['edit-input']}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={updateProfileMutation.isPending || isEditClosing}
                          placeholder="Введіть новий пароль"
                        />
                      </div>
                    )}

                    <div className={styles['edit-input-group']}>
                      <label>Поточний пароль</label>
                      <input
                        type="password"
                        className={styles['edit-input']}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={updateProfileMutation.isPending || isEditClosing}
                        placeholder="Для підтвердження змін"
                      />
                    </div>

                    <div className={styles['edit-actions']}>
                      <button
                        className={styles['save-btn']}
                        disabled={updateProfileMutation.isPending || isEditClosing}
                        onClick={handleSaveEdit}
                      >
                        {updateProfileMutation.isPending ? 'Збереження...' : 'Зберегти'}
                      </button>
                      <button
                        className={styles['edit-cancel-btn']}
                        onClick={handleCancelEdit}
                        disabled={updateProfileMutation.isPending || isEditClosing}
                      >
                        Відмінити
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles['profile-info-box']}>
                <div className={styles['profile-info-header']}>
                  <strong>Акаунт створено:</strong>&nbsp;{new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>
            </>
          ) : (
            <p style={{ textAlign: 'center' }}>Помилка завантаження профілю</p>
          )}

          <button className={styles['profile-red-button']} onClick={logout}>
            Вийти
          </button>

          <div className={styles['danger-zone']}>
            {!showDeleteConfirm ? (
              <button
                className={`${styles['profile-red-button']} ${styles['outline']}`}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Видалити акаунт
              </button>
            ) : (
              <div className={`${styles['confirmation-panel']} ${isClosing ? styles['closing'] : ''}`}>
                <p className={styles['confirmation-text']}>
                  Ця дія є незворотною. Введіть свій логін <strong>{profile?.login}</strong> для підтвердження:
                </p>
                <div className={styles['confirmation-row']}>
                  <input
                    type="text"
                    className={styles['confirm-input']}
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="Введіть логін..."
                    disabled={isClosing}
                  />
                  <div className={styles['confirm-actions']}>
                    <button
                      className={styles['confirm-btn']}
                      disabled={!isDeleteMatched || deleteProfileMutation.isPending || isClosing}
                      onClick={handleDeleteAccount}
                    >
                      {deleteProfileMutation.isPending ? 'Видалення...' : 'Підтвердити'}
                    </button>
                    <button
                      className={styles['cancel-btn']}
                      onClick={handleCancelDelete}
                      disabled={deleteProfileMutation.isPending || isClosing}
                    >
                      Відмінити
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
