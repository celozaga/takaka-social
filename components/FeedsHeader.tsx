import React from 'react';
import { ArrowLeft } from 'lucide-react';

const FeedsHeader: React.FC = () => {
    return (
        <div className="sticky top-0 -mx-4 -mt-4 px-4 bg-surface-1 z-30">
            <div className="flex items-center gap-4 h-16">
                <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-surface-3">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">Feeds</h1>
            </div>
        </div>
    );
};

export default FeedsHeader;