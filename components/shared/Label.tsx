import React from 'react';
import { ComAtprotoLabelDefs } from '@atproto/api';
import { ShieldAlert } from 'lucide-react';

const Label: React.FC<{ label: ComAtprotoLabelDefs.Label }> = ({ label }) => {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold bg-surface-3 text-on-surface-variant px-2 py-1 rounded-md">
      <ShieldAlert size={14} />
      <span>{label.val}</span>
    </div>
  );
};

export default Label;
