
import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';

const NotificationsHeader: React.FC = () => {
    return (
        <div className="sticky top-0 -mx-4 -mt-4 px-4 bg-surface-1 z-30">
            <div className="flex items-center justify-between h-16">
                 <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-surface-3">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold">Notifications</h1>
                </div>
                <a href="#/settings" className="p-2 rounded-full hover:bg-surface-3" aria-label="Settings">
                    <Settings size={20} />
                </a>
            </div>
        </div>
    );
};

export default NotificationsHeader;
