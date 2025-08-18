import { useEffect } from 'react';

const DEFAULT_TITLE = 'Takaka - A Bluesky Client';
const DEFAULT_DESCRIPTION = 'A Bluesky client focused on creative content and lifestyle.';
const DEFAULT_IMAGE_PATH = '/vite.svg'; 

interface HeadManagerProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  type?: 'profile' | 'article' | 'website';
}

const updateMetaTag = (selectorAttribute: string, selectorValue: string, content: string) => {
  let element = document.head.querySelector(`meta[${selectorAttribute}="${selectorValue}"]`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(selectorAttribute, selectorValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const updateLinkTag = (rel: string, href: string) => {
  let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
};

export const useHeadManager = ({ title, description, imageUrl, type = 'website' }: HeadManagerProps = {}) => {
  useEffect(() => {
    const originalTitle = document.title;
    
    const newTitle = title ? `${title} | Takaka` : DEFAULT_TITLE;
    const newDescription = description ? description.substring(0, 160).replace(/\n/g, ' ') : DEFAULT_DESCRIPTION;
    const newImageUrl = imageUrl || new URL(DEFAULT_IMAGE_PATH, window.location.origin).toString();
    const canonicalUrl = window.location.href;

    document.title = newTitle;

    // Standard & Twitter
    updateMetaTag('name', 'description', newDescription);
    updateMetaTag('name', 'twitter:card', imageUrl ? 'summary_large_image' : 'summary');
    updateMetaTag('name', 'twitter:title', newTitle);
    updateMetaTag('name', 'twitter:description', newDescription);
    updateMetaTag('name', 'twitter:image', newImageUrl);
    
    // Open Graph
    updateMetaTag('property', 'og:title', newTitle);
    updateMetaTag('property', 'og:description', newDescription);
    updateMetaTag('property', 'og:image', newImageUrl);
    updateMetaTag('property', 'og:url', canonicalUrl);
    updateMetaTag('property', 'og:site_name', 'Takaka');
    updateMetaTag('property', 'og:type', type);

    // Canonical URL
    updateLinkTag('canonical', canonicalUrl);

    // Cleanup
    return () => {
      document.title = originalTitle;
    };
  }, [title, description, imageUrl, type]);
};
