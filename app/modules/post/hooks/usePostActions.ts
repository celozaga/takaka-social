// ============================================================================
// usePostActions Hook
// ============================================================================
//
// Hook for managing post interactions and actions
//

import { useState, useCallback } from 'react';
import { PostData, PostInteraction } from '../types';
import { defaultApiClient } from '../../../core/api';
import { helpers } from '../../../core/utils';

export interface UsePostActionsOptions {
  onLike?: (post: PostData) => void;
  onUnlike?: (post: PostData) => void;
  onRepost?: (post: PostData) => void;
  onUnrepost?: (post: PostData) => void;
  onReply?: (post: PostData) => void;
  onQuote?: (post: PostData) => void;
  onShare?: (post: PostData) => void;
  onBookmark?: (post: PostData) => void;
  onReport?: (post: PostData) => void;
  onDelete?: (post: PostData) => void;
  enableOptimisticUpdates?: boolean;
}

export interface UsePostActionsReturn {
  // Action states
  isLiking: boolean;
  isReposting: boolean;
  isDeleting: boolean;
  isReporting: boolean;
  
  // Action functions
  like: (post: PostData) => Promise<void>;
  unlike: (post: PostData) => Promise<void>;
  repost: (post: PostData) => Promise<void>;
  unrepost: (post: PostData) => Promise<void>;
  reply: (post: PostData) => void;
  quote: (post: PostData) => void;
  share: (post: PostData) => Promise<void>;
  bookmark: (post: PostData) => Promise<void>;
  report: (post: PostData, reason: string) => Promise<void>;
  deletePost: (post: PostData) => Promise<void>;
  
  // Utility functions
  canDelete: (post: PostData) => boolean;
  canReport: (post: PostData) => boolean;
  getInteractionState: (post: PostData) => {
    isLiked: boolean;
    isReposted: boolean;
    isBookmarked: boolean;
  };
}

export function usePostActions(options: UsePostActionsOptions = {}): UsePostActionsReturn {
  const {
    onLike,
    onUnlike,
    onRepost,
    onUnrepost,
    onReply,
    onQuote,
    onShare,
    onBookmark,
    onReport,
    onDelete,
    enableOptimisticUpdates = true
  } = options;

  // Action states
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  // Like post
  const like = useCallback(async (post: PostData) => {
    if (isLiking || post.viewer?.like) return;

    setIsLiking(true);
    
    try {
      // Optimistic update
      if (enableOptimisticUpdates && onLike) {
        const optimisticPost = {
          ...post,
          likeCount: post.likeCount + 1,
          viewer: {
            ...post.viewer,
            like: 'temp-like-uri'
          }
        };
        onLike(optimisticPost);
      }

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

      // Update with actual response
      if (onLike) {
        const updatedPost = {
          ...post,
          likeCount: post.likeCount + 1,
          viewer: {
            ...post.viewer,
            like: response.uri
          }
        };
        onLike(updatedPost);
      }
    } catch (error) {
      console.error('Failed to like post:', error);
      
      // Revert optimistic update on error
      if (enableOptimisticUpdates && onLike) {
        onLike(post);
      }
      
      throw error;
    } finally {
      setIsLiking(false);
    }
  }, [isLiking, onLike, enableOptimisticUpdates]);

  // Unlike post
  const unlike = useCallback(async (post: PostData) => {
    if (isLiking || !post.viewer?.like) return;

    setIsLiking(true);
    
    try {
      // Optimistic update
      if (enableOptimisticUpdates && onUnlike) {
        const optimisticPost = {
          ...post,
          likeCount: Math.max(0, post.likeCount - 1),
          viewer: {
            ...post.viewer,
            like: undefined
          }
        };
        onUnlike(optimisticPost);
      }

      await defaultApiClient.post('com.atproto.repo.deleteRecord', {
        repo: defaultApiClient.session?.did,
        collection: 'app.bsky.feed.like',
        rkey: post.viewer.like.split('/').pop()
      });

      // Update with actual response
      if (onUnlike) {
        const updatedPost = {
          ...post,
          likeCount: Math.max(0, post.likeCount - 1),
          viewer: {
            ...post.viewer,
            like: undefined
          }
        };
        onUnlike(updatedPost);
      }
    } catch (error) {
      console.error('Failed to unlike post:', error);
      
      // Revert optimistic update on error
      if (enableOptimisticUpdates && onUnlike) {
        onUnlike(post);
      }
      
      throw error;
    } finally {
      setIsLiking(false);
    }
  }, [isLiking, onUnlike, enableOptimisticUpdates]);

  // Repost
  const repost = useCallback(async (post: PostData) => {
    if (isReposting || post.viewer?.repost) return;

    setIsReposting(true);
    
    try {
      // Optimistic update
      if (enableOptimisticUpdates && onRepost) {
        const optimisticPost = {
          ...post,
          repostCount: post.repostCount + 1,
          viewer: {
            ...post.viewer,
            repost: 'temp-repost-uri'
          }
        };
        onRepost(optimisticPost);
      }

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

      // Update with actual response
      if (onRepost) {
        const updatedPost = {
          ...post,
          repostCount: post.repostCount + 1,
          viewer: {
            ...post.viewer,
            repost: response.uri
          }
        };
        onRepost(updatedPost);
      }
    } catch (error) {
      console.error('Failed to repost:', error);
      
      // Revert optimistic update on error
      if (enableOptimisticUpdates && onRepost) {
        onRepost(post);
      }
      
      throw error;
    } finally {
      setIsReposting(false);
    }
  }, [isReposting, onRepost, enableOptimisticUpdates]);

  // Unrepost
  const unrepost = useCallback(async (post: PostData) => {
    if (isReposting || !post.viewer?.repost) return;

    setIsReposting(true);
    
    try {
      // Optimistic update
      if (enableOptimisticUpdates && onUnrepost) {
        const optimisticPost = {
          ...post,
          repostCount: Math.max(0, post.repostCount - 1),
          viewer: {
            ...post.viewer,
            repost: undefined
          }
        };
        onUnrepost(optimisticPost);
      }

      await defaultApiClient.post('com.atproto.repo.deleteRecord', {
        repo: defaultApiClient.session?.did,
        collection: 'app.bsky.feed.repost',
        rkey: post.viewer.repost.split('/').pop()
      });

      // Update with actual response
      if (onUnrepost) {
        const updatedPost = {
          ...post,
          repostCount: Math.max(0, post.repostCount - 1),
          viewer: {
            ...post.viewer,
            repost: undefined
          }
        };
        onUnrepost(updatedPost);
      }
    } catch (error) {
      console.error('Failed to unrepost:', error);
      
      // Revert optimistic update on error
      if (enableOptimisticUpdates && onUnrepost) {
        onUnrepost(post);
      }
      
      throw error;
    } finally {
      setIsReposting(false);
    }
  }, [isReposting, onUnrepost, enableOptimisticUpdates]);

  // Reply to post
  const reply = useCallback((post: PostData) => {
    if (onReply) {
      onReply(post);
    }
  }, [onReply]);

  // Quote post
  const quote = useCallback((post: PostData) => {
    if (onQuote) {
      onQuote(post);
    }
  }, [onQuote]);

  // Share post
  const share = useCallback(async (post: PostData) => {
    try {
      const shareUrl = `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.author.displayName || post.author.handle}`,
          text: post.record.text,
          url: shareUrl
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
      }
      
      if (onShare) {
        onShare(post);
      }
    } catch (error) {
      console.error('Failed to share post:', error);
      throw error;
    }
  }, [onShare]);

  // Bookmark post
  const bookmark = useCallback(async (post: PostData) => {
    try {
      // This would typically save to local storage or a bookmarks service
      const bookmarks = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]');
      const isBookmarked = bookmarks.some((b: any) => b.uri === post.uri);
      
      if (isBookmarked) {
        const updatedBookmarks = bookmarks.filter((b: any) => b.uri !== post.uri);
        localStorage.setItem('bookmarked_posts', JSON.stringify(updatedBookmarks));
      } else {
        bookmarks.push({
          uri: post.uri,
          cid: post.cid,
          bookmarkedAt: new Date().toISOString()
        });
        localStorage.setItem('bookmarked_posts', JSON.stringify(bookmarks));
      }
      
      if (onBookmark) {
        onBookmark(post);
      }
    } catch (error) {
      console.error('Failed to bookmark post:', error);
      throw error;
    }
  }, [onBookmark]);

  // Report post
  const report = useCallback(async (post: PostData, reason: string) => {
    setIsReporting(true);
    
    try {
      await defaultApiClient.post('com.atproto.moderation.createReport', {
        reasonType: reason,
        subject: {
          $type: 'com.atproto.repo.strongRef',
          uri: post.uri,
          cid: post.cid
        }
      });
      
      if (onReport) {
        onReport(post);
      }
    } catch (error) {
      console.error('Failed to report post:', error);
      throw error;
    } finally {
      setIsReporting(false);
    }
  }, [onReport]);

  // Delete post
  const deletePost = useCallback(async (post: PostData) => {
    setIsDeleting(true);
    
    try {
      await defaultApiClient.post('com.atproto.repo.deleteRecord', {
        repo: defaultApiClient.session?.did,
        collection: 'app.bsky.feed.post',
        rkey: post.uri.split('/').pop()
      });
      
      if (onDelete) {
        onDelete(post);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete]);

  // Check if user can delete post
  const canDelete = useCallback((post: PostData): boolean => {
    return post.author.did === defaultApiClient.session?.did;
  }, []);

  // Check if user can report post
  const canReport = useCallback((post: PostData): boolean => {
    return post.author.did !== defaultApiClient.session?.did;
  }, []);

  // Get interaction state
  const getInteractionState = useCallback((post: PostData) => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]');
    
    return {
      isLiked: !!post.viewer?.like,
      isReposted: !!post.viewer?.repost,
      isBookmarked: bookmarks.some((b: any) => b.uri === post.uri)
    };
  }, []);

  return {
    // States
    isLiking,
    isReposting,
    isDeleting,
    isReporting,
    
    // Actions
    like,
    unlike,
    repost,
    unrepost,
    reply,
    quote,
    share,
    bookmark,
    report,
    deletePost,
    
    // Utilities
    canDelete,
    canReport,
    getInteractionState
  };
}

export default usePostActions;