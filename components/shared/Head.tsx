import React, { useEffect } from 'react';
import { Platform } from 'react-native';

const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        // This component is a no-op on native platforms.
        if (Platform.OS !== 'web' || typeof document === 'undefined') {
            return;
        }

        const originalTitle = document.title;
        const metaTags: Element[] = [];

        React.Children.forEach(children, child => {
            if (React.isValidElement(child)) {
                if (child.type === 'title' && typeof (child.props as any).children === 'string') {
                    document.title = (child.props as any).children;
                } else if (child.type === 'meta') {
                    const meta = document.createElement('meta');
                    Object.keys(child.props).forEach(prop => {
                        meta.setAttribute(prop, (child.props as any)[prop]);
                    });
                    document.head.appendChild(meta);
                    metaTags.push(meta);
                }
            }
        });

        return () => {
            document.title = originalTitle;
            metaTags.forEach(tag => {
                if (document.head.contains(tag)) {
                    document.head.removeChild(tag);
                }
            });
        };
    }, [children]);

    return null;
};

export default Head;