

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUI } from '../../context/UIContext';
import { LogIn } from 'lucide-react';

const LoginPrompt: React.FC = () => {
  const { openLoginModal } = useUI();
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-50">
      <div className="bg-primary-container text-on-primary-container p-3 rounded-xl shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
        <div>
            <p className="font-semibold text-sm">{t('loginPrompt.title')}</p>
            <p className="text-xs opacity-80">{t('loginPrompt.description')}</p>
        </div>
        <button 
            onClick={openLoginModal}
            className="bg-primary text-on-primary font-bold py-2 px-4 rounded-full text-sm flex-shrink-0 flex items-center gap-2"
        >
          <LogIn size={16} />
          {t('nav.signIn')}
        </button>
      </div>
    </div>
  );
};

export default LoginPrompt;
