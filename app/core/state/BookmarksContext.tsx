

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useAtp } from './AtpContext';
import { AtUri, ComAtprotoRepoStrongRef } from '@atproto/api';
import { AppBskyFeedDefs } from '@atproto/api';

const BOOKMARK_COLLECTION = 'app.myclient.bookmark';

interface BookmarkRecord {
    rkey: string;
    uri: string;
    postUri: string;
}

interface BookmarksContextType {
    isReady: boolean;
    bookmarks: Map<string, BookmarkRecord>; // Map<postUri, BookmarkRecord>
    addBookmark: (post: AppBskyFeedDefs.PostView) => Promise<void>;
    removeBookmark: (postUri: string) => Promise<void>;
    isBookmarked: (postUri: string) => boolean;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export const BookmarksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { agent, session } = useAtp();
    const [isReady, setIsReady] = useState(false);
    const [bookmarks, setBookmarks] = useState<Map<string, BookmarkRecord>>(new Map());

    const loadBookmarks = useCallback(async () => {
        if (!session) {
            setBookmarks(new Map());
            setIsReady(true);
            return;
        }
        setIsReady(false);
        try {
            const newBookmarks = new Map<string, BookmarkRecord>();
            let cursor: string | undefined;
            do {
                const res = await agent.com.atproto.repo.listRecords({
                    repo: session.did,
                    collection: BOOKMARK_COLLECTION,
                    limit: 100,
                    cursor,
                });
                for (const record of res.data.records) {
                    const postUri = (record.value as any).subject.uri;
                    newBookmarks.set(postUri, {
                        rkey: new AtUri(record.uri).rkey,
                        uri: record.uri,
                        postUri: postUri,
                    });
                }
                cursor = res.data.cursor;
            } while (cursor);
            setBookmarks(newBookmarks);
        } catch (error) {
            console.error("Failed to load bookmarks", error);
        } finally {
            setIsReady(true);
        }
    }, [agent, session]);

    useEffect(() => {
        loadBookmarks();
    }, [loadBookmarks]);

    const addBookmark = useCallback(async (post: AppBskyFeedDefs.PostView) => {
        if (!session) return;
        
        const record = {
            $type: BOOKMARK_COLLECTION,
            subject: {
                uri: post.uri,
                cid: post.cid,
            } as ComAtprotoRepoStrongRef.Main,
            createdAt: new Date().toISOString(),
        };

        const res = await agent.com.atproto.repo.createRecord({
            repo: session.did,
            collection: BOOKMARK_COLLECTION,
            record: record,
        });

        setBookmarks(prev => {
            const newMap = new Map(prev);
            newMap.set(post.uri, {
                rkey: new AtUri(res.data.uri).rkey,
                uri: res.data.uri,
                postUri: post.uri
            });
            return newMap;
        });
    }, [agent, session]);

    const removeBookmark = useCallback(async (postUri: string) => {
        if (!session) return;
        const bookmark = bookmarks.get(postUri);
        if (!bookmark) return;

        await agent.com.atproto.repo.deleteRecord({
            repo: session.did,
            collection: BOOKMARK_COLLECTION,
            rkey: bookmark.rkey,
        });

        setBookmarks(prev => {
            const newMap = new Map(prev);
            newMap.delete(postUri);
            return newMap;
        });
    }, [agent, session, bookmarks]);

    const isBookmarked = (postUri: string) => bookmarks.has(postUri);

    const value = {
        isReady,
        bookmarks,
        addBookmark,
        removeBookmark,
        isBookmarked,
    };

    return (
        <BookmarksContext.Provider value={value}>
            {children}
        </BookmarksContext.Provider>
    );
};

export const useBookmarks = (): BookmarksContextType => {
    const context = useContext(BookmarksContext);
    if (!context) {
        throw new Error('useBookmarks must be used within a BookmarksProvider');
    }
    return context;
};
