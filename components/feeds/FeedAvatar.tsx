
import React, { useState } from 'react';
import { List } from 'lucide-react';

interface FeedAvatarProps {
  src?: string;
  alt: string;
  className: string;
}

const FeedAvatar: React.FC<FeedAvatarProps> = ({ src, alt, className }) => {
  // Initialize with error if src is falsy from the start
  const [hasError, setHasError] = useState(!src);

  const handleError = () => {
    if (!hasError) { // Prevent infinite loops
        setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-surface-3`}>
        <List className="w-1/2 h-1/2 text-on-surface-variant" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default FeedAvatar;
