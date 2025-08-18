import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AtSign, KeyRound, LogIn } from 'lucide-react';

interface LoginScreenProps {
  onSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAtp();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(identifier, appPassword);
      onSuccess();
    } catch (err: any) {
      setError(err.message || t('signIn.loginFailed'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full pl-12 pr-4 py-3 bg-surface-3 rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-3 outline-none transition duration-200";

  return (
    <div className="w-full max-w-md bg-surface-2 rounded-2xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary">{t('signIn.title')}</h1>
        <p className="text-on-surface-variant mt-2">{t('signIn.description')}</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="relative">
          <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t('signIn.handlePlaceholder')}
            className={inputClasses}
            required
          />
        </div>
        <div className="relative">
          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            type="password"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            placeholder={t('signIn.appPasswordPlaceholder')}
            className={inputClasses}
            required
          />
        </div>
        <div className="text-xs text-on-surface-variant text-center px-2">
          <Trans i18nKey="signIn.appPasswordNotice">
            <strong>Important:</strong> For security, please use an{' '}
            <a href="https://bsky.app/settings/app-passwords" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              App Password
            </a>
            , not your main password.
          </Trans>
        </div>
        {error && <p className="text-error text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-on-primary font-bold py-3 px-4 rounded-full transition duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-t-transparent border-on-primary rounded-full animate-spin"></div>
              <span>{t('signIn.buttonLoading')}</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>{t('signIn.button')}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
