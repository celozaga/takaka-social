import React, { useState, useEffect } from 'react';
import { resizeImage } from '../../lib/image';

interface ResizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  resizeWidth: number;
}

const ResizedImage: React.FC<ResizedImageProps> = ({ src, resizeWidth, ...props }) => {
  const [imageSrc, setImageSrc] = useState(src ? resizeImage(src, resizeWidth) : '');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // When the src prop changes, reset the error state and try the proxy again.
    setHasError(false);
    setImageSrc(src ? resizeImage(src, resizeWidth) : '');
  }, [src, resizeWidth]);

  const handleError = () => {
    // Only try to fall back once to prevent an infinite loop if the original src also fails.
    if (!hasError) {
      setHasError(true);
      setImageSrc(src); // Fallback to the original, un-proxied URL.
    }
  };

  if (!src) {
    // Render nothing or a placeholder if no src is provided, matching standard img behavior.
    return <img {...props} src="" />;
  }

  return <img src={imageSrc} onError={handleError} {...props} />;
};

export default ResizedImage;
