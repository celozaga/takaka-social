import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUI } from '../../context/UIContext';
import ScreenHeader from '../layout/ScreenHeader';
import { supportedLanguages } from '../../lib/i18n';
import { Check } from 'lucide-react';
import { useHeadManager } from '../../hooks/useHeadManager';

const LanguageSettingsScreen: React.FC = () => {
    const { setCustomFeedHeaderVisible } = useUI();
    const { t, i18n } = useTranslation();

    useHeadManager({ title: t('languageSettings.title') });

    React.useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    const changeLanguage = (langCode: string) => {
        i18n.changeLanguage(langCode);
    };

    return (
        <div>
            <ScreenHeader title={t('languageSettings.title')} />
            <div className="mt-4">
                <p className="text-on-surface-variant text-sm px-4 mb-4">{t('languageSettings.description')}</p>
                <div className="bg-surface-2 rounded-lg overflow-hidden">
                    {supportedLanguages.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className="w-full flex items-center justify-between p-4 hover:bg-surface-3 transition-colors"
                        >
                            <span className="font-semibold">{lang.name}</span>
                            {i18n.language.startsWith(lang.code) && <Check className="w-5 h-5 text-primary" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LanguageSettingsScreen;
