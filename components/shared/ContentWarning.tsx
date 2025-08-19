
import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface ContentWarningProps {
  reason: string;
  onShow: () => void;
}

const ContentWarning: React.FC<ContentWarningProps> = ({ reason, onShow }) => {
  return (
    <div className="bg-surface-2 rounded-xl p-4 flex flex-col items-center text-center">
      <ShieldAlert className="w-10 h-10 text-on-surface-variant mb-3" />
      <p className="font-semibold">Content Warning</p>
      <p className="text-sm text-on-surface-variant mb-4 capitalize">{reason}</p>
      <button
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onShow();
        }}
        className="bg-surface-3 hover:bg-surface-3/80 text-on-surface font-bold py-2 px-6 rounded-full transition duration-200"
      >
        Show
      </button>
    </div>
  );
};

export default ContentWarning;
