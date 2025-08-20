import React, { useEffect } from 'react';

const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        const originalTitle = document.title;
        const metaTags: Element[] = [];

        React.Children.forEach(children, child => {
            if (React.isValidElement(child)) {
                if (child.type === 'title' && typeof child.props.children === 'string') {
                    document.title = child.props.children;
                } else if (child.type === 'meta') {
                    const meta = document.createElement('meta');
                    Object.keys(child.props).forEach(prop => {
                        meta.setAttribute(prop, child.props[prop]);
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
