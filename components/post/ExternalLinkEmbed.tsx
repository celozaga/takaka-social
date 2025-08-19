
import React from 'react';
import { AppBskyEmbedExternal } from '@atproto/api';

const ExternalLinkEmbed: React.FC<{ embed:AppBskyEmbedExternal.View }> = ({ embed }) => {
    const { uri, title, description, thumb } = embed.external;

    return (
        <a 
            href={uri} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-2 block border border-outline rounded-xl overflow-hidden hover:bg-surface-3 transition-colors"
            onClick={(e) => e.stopPropagation()}
        >
            {thumb && (
                <div className="bg-surface-3 aspect-video overflow-hidden flex items-center justify-center">
                    <img src={thumb} alt={title} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="p-3">
                <p className="text-sm text-on-surface-variant line-clamp-1">{new URL(uri).hostname}</p>
                <p className="font-semibold text-on-surface mt-0.5 line-clamp-2">{title}</p>
                <p className="text-sm text-on-surface-variant mt-1 line-clamp-3">{description}</p>
            </div>
        </a>
    );
};

export default ExternalLinkEmbed;
