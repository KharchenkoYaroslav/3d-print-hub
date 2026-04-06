import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { useLoginMutation, useRegisterMutation } from "../../hooks/useAuth";
import { useAuthContext } from "../../providers/AuthProvider";
import styles from "./auth.module.scss";

export default function Auth() {
  const navigate = useNavigate();
  const { login: setAuthTokens } = useAuthContext();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const [loginStr, setLoginStr] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleLogin = () => {
    setErrorMsg("");
    if (!loginStr || !password) return setErrorMsg("Введіть логін та пароль");

    loginMutation.mutate({ login: loginStr, password }, {
      onSuccess: (data) => {
        setAuthTokens(data.accessToken, data.refreshToken);
        navigate("/");
      },
      onError: (err: unknown) => {
        if (isAxiosError(err) && err.response?.data?.message) {
          setErrorMsg(err.response.data.message);
        } else {
          setErrorMsg("Помилка авторизації");
        }
      }
    });
  };

  const handleRegister = () => {
    setErrorMsg("");
    if (!loginStr || !password) return setErrorMsg("Введіть логін та пароль");

    registerMutation.mutate({ login: loginStr, password }, {
      onSuccess: (data) => {
        setAuthTokens(data.accessToken, data.refreshToken);
        navigate("/");
      },
      onError: (err: unknown) => {
        if (isAxiosError(err) && err.response?.data?.message) {
          setErrorMsg(err.response.data.message);
        } else {
          setErrorMsg("Помилка реєстрації");
        }
      }
    });
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className={styles['auth-container']}>
      <div className={styles['auth-card']}>
        <h1 className={styles['auth-title']}>Ласкаво просимо до 3D Print Hub</h1>
        <div className={styles['auth-form-wrapper']}>
          {errorMsg && <div style={{color: '#ff4d4f', marginBottom: '15px', textAlign: 'center'}}>{errorMsg}</div>}

          <div className={styles['auth-input-group']}>
            <label className={styles['auth-label']}>Логін</label>
            <input
              type="text"
              className={styles['auth-input']}
              value={loginStr}
              onChange={(e) => setLoginStr(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className={styles['auth-input-group']}>
            <label className={styles['auth-label']}>Пароль</label>
            <input
              type="password"
              className={styles['auth-input']}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className={styles['auth-actions']}>
            <button
              className={`${styles['auth-btn']} ${styles['auth-btn-login']}`}
              onClick={handleLogin}
              disabled={isLoading}
            >
              {loginMutation.isPending ? 'Вхід...' : 'Увійти'}
            </button>
            <button
              className={`${styles['auth-btn']} ${styles['auth-btn-register']}`}
              onClick={handleRegister}
              disabled={isLoading}
            >
              {registerMutation.isPending ? 'Реєстрація...' : 'Зареєструватися'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
