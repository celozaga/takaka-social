// ============================================================================
// usePostData Hook
// ============================================================================
//
// Hook for fetching and managing post data
//

import { useState, useEffect, useCallback, useRef } from 'react';
import { PostData, PostThread, UsePostOptions, UsePostReturn } from '../types';
import { defaultApiClient } from '../../../core/api';
import { postUtils } from '../utils';
import { helpers } from '../../../core/utils';

export function usePostData(options: UsePostOptions = {}): UsePostReturn {
  const {
    postUri,
    includeThread = false,
    refreshInterval,
    autoRefresh = false
  } = options;

  // State
  const [post, setPost] = useState<PostData | undefined>();
  const [thread, setThread] = useState<PostThread | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Fetch post data
  const fetchPost = useCallback(async (uri: string, signal?: AbortSignal) => {
    try {
      const cacheKey = postUtils.cache.generateKey(uri, includeThread);
      
      // Check cache first
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (!postUtils.cache.isExpired(timestamp)) {
          if (includeThread && data.thread) {
            setThread(data.thread);
            setPost(data.thread.post);
          } else if (!includeThread && data.post) {
            setPost(data.post);
          }
          return;
        }
      }

      let response;
      
      if (includeThread) {
        response = await defaultApiClient.get('app.bsky.feed.getPostThread', {
          uri,
          depth: 10,
          parentHeight: 10
        }, { signal });
        
        if (response.thread) {
          setThread(response.thread);
          setPost(response.thread.post);
          
          // Cache the thread
          localStorage.setItem(cacheKey, JSON.stringify({
            data: { thread: response.thread },
            timestamp: new Date().toISOString()
          }));
        }
      } else {
        response = await defaultApiClient.get('app.bsky.feed.getPosts', {
          uris: [uri]
        }, { signal });
        
        if (response.posts && response.posts.length > 0) {
          const postData = response.posts[0];
          setPost(postData);
          
          // Cache the post
          localStorage.setItem(cacheKey, JSON.stringify({
            data: { post: postData },
            timestamp: new Date().toISOString()
          }));
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch post:', err);
        setError(err.message || 'Failed to fetch post');
      }
    }
  }, [includeThread]);

  // Refresh function
  const refresh = useCallback(async () => {
    if (!postUri) return;

    setIsLoading(true);
    setError(undefined);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      await fetchPost(postUri, abortControllerRef.current.signal);
    } finally {
      setIsLoading(false);
    }
  }, [postUri, fetchPost]);

  // Like post
  const like = useCallback(async () => {
    if (!post || post.viewer?.like) return;

    try {
      const response = await defaultApiClient.post('com.atproto.repo.createRecord', {
        repo: defaultApiClient.session?.did,
        collection: 'app.bsky.feed.like',
        record: {
          subject: {
            uri: post.uri,
            cid: post.cid
          },
          createdAt: new Date().toISOString()
        }
      });

      // Update local state
      const updatedPost = {
        ...post,
        likeCount: post.likeCount + 1,
        viewer: {
          ...post.viewer,
          like: response.uri
        }
      };
      
      setPost(updatedPost);
      
      // Update thread if available
      if (thread) {
        setThread({
          ...thread,
          post: updatedPost
        });
      }
    } catch (error) {
      console.error('Failed to like post:', error);
      throw error;
    }
  }, [post, thread]);

  // Unlike post
  const unlike = useCallback(async () => {
    if (!post || !post.viewer?.like) return;

    try {
      await defaultApiClient.post('com.atproto.repo.deleteRecord', {
        repo: defaultApiClient.session?.did,
        collection: 'app.bsky.feed.like',
        rkey: post.viewer.like.split('/').pop()
      });

      // Update local state
      const updatedPost = {
        ...post,
        likeCount: Math.max(0, post.likeCount - 1),
        viewer: {
          ...post.viewer,
          like: undefined
        }
      };
      
      setPost(updatedPost);
      
      // Update thread if available
      if (thread) {
        setThread({
          ...thread,
          post: updatedPost
        });
      }
    } catch (error) {
      console.error('Failed to unlike post:', error);
      throw error;
    }
  }, [post, thread]);

  // Repost
  const repost = useCallback(async () => {
    if (!post || post.viewer?.repost) return;

    try {
      const response = await defaultApiClient.post('com.atproto.repo.createRecord', {
        repo: defaultApiClient.session?.did,
        collection: 'app.bsky.feed.repost',
        record: {
          subject: {
            uri: post.uri,
            cid: post.cid
          },
          createdAt: new Date().toISOString()
        }
      });

      // Update local state
      const updatedPost = {
        ...post,
        repostCount: post.repostCount + 1,
        viewer: {
          ...post.viewer,
          repost: response.uri
        }
      };
      
      setPost(updatedPost);
      
      // Update thread if available
      if (thread) {
        setThread({
          ...thread,
          post: updatedPost
        });
      }
    } catch (error) {
      console.error('Failed to repost:', error);
      throw error;
    }
  }, [post, thread]);

  // Unrepost
  const unrepost = useCallback(async () => {
    if (!post || !post.viewer?.repost) return;

    try {
      await defaultApiClient.post('com.atproto.repo.deleteRecord', {
        repo: defaultApiClient.session?.did,
        collection: 'app.bsky.feed.repost',
        rkey: post.viewer.repost.split('/').pop()
      });

      // Update local state
      const updatedPost = {
        ...post,
        repostCount: Math.max(0, post.repostCount - 1),
        viewer: {
          ...post.viewer,
          repost: undefined
        }
      };
      
      setPost(updatedPost);
      
      // Update thread if available
      if (thread) {
        setThread({
          ...thread,
          post: updatedPost
        });
      }
    } catch (error) {
      console.error('Failed to unrepost:', error);
      throw error;
    }
  }, [post, thread]);

  // Delete post
  const deletePost = useCallback(async () => {
    if (!post || post.author.did !== defaultApiClient.session?.did) return;

    try {
      await defaultApiClient.post('com.atproto.repo.deleteRecord', {
        repo: defaultApiClient.session?.did,
        collection: 'app.bsky.feed.post',
        rkey: post.uri.split('/').pop()
      });

      // Clear local state
      setPost(undefined);
      setThread(undefined);
      
      // Clear cache
      const cacheKey = postUtils.cache.generateKey(post.uri, includeThread);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw error;
    }
  }, [post, includeThread]);

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval && postUri) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, postUri, refresh]);

  // Initial fetch
  useEffect(() => {
    if (postUri) {
      refresh();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [postUri, refresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    post,
    thread,
    isLoading,
    error,
    refresh,
    like,
    unlike,
    repost,
    unrepost,
    delete: deletePost
  };
}

export default usePostData;