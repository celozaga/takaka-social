import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ScreenHeaderProps {
    title: string;
    children?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, children }) => {
    const { t } = useTranslation();
    return (
        <div className="sticky top-0 -mx-4 px-4 bg-surface-1/80 backdrop-blur-sm z-30">
            <div className="flex items-center justify-between h-16">
                 <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-surface-3" aria-label={t('common.back')}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold truncate">{title}</h1>
                </div>
                {children && <div className="flex items-center gap-2">{children}</div>}
            </div>
        </div>
    );
};

export default ScreenHeader;