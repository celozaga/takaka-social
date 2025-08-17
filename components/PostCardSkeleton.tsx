import React from 'react';

const PostCardSkeleton: React.FC = () => {
  // Use a random height to better simulate a masonry layout
  const randomHeight = Math.floor(Math.random() * (350 - 200 + 1)) + 200;

  return (
    <div className="bg-surface-2 rounded-xl overflow-hidden animate-pulse flex flex-col">
      {/* Media placeholder */}
      <div className="w-full bg-surface-3" style={{ height: `${randomHeight}px` }}></div>
      
      {/* Content placeholder */}
      <div className="p-3">
        <div className="h-4 w-5/6 bg-surface-3 rounded mb-3"></div>
        <div className="flex items-center justify-between gap-2 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-surface-3"></div>
            <div className="h-4 w-24 bg-surface-3 rounded"></div>
          </div>
          <div className="h-5 w-20 bg-surface-3 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default PostCardSkeleton;