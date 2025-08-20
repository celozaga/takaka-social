import React, { useState } from 'react';
import { useAtp } from '../context/AtpContext';
import { AtSign, KeyRound, LogIn } from 'lucide-react';
import { WEB_CLIENT_URL } from '../lib/config';

interface LoginScreenProps {
  onSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAtp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(identifier, appPassword);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your handle and app password.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-surface-2 rounded-2xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary">Sign In to Takaka</h1>
        <p className="text-on-surface-variant mt-2">to interact and post</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="relative">
          <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="your-handle.bsky.social"
            className="w-full pl-12 pr-4 py-3 bg-surface-3 rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-3 outline-none transition duration-200"
            required
          />
        </div>
        <div className="relative">
          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            type="password"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            placeholder="App Password"
            className="w-full pl-12 pr-4 py-3 bg-surface-3 rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-3 outline-none transition duration-200"
            required
          />
        </div>
        <div className="text-xs text-on-surface-variant text-center px-2">
          <strong>Important:</strong> For security, please use an{' '}
          <a href={`${WEB_CLIENT_URL}/settings/app-passwords`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            App Password
          </a>
          , not your main password.
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
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
