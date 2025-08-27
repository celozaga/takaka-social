// ============================================================================
// useComposer Hook
// ============================================================================
//
// Hook for managing post composition state and actions
//

import { useState, useCallback, useEffect, useMemo } from 'react';
import { ComposerState, ComposerOptions, ComposerValidation, UseComposerReturn, PostData, PostEmbed, MediaUpload } from '../types';
import { defaultApiClient } from '../../../core/api';
import { postUtils } from '../utils';
import { helpers } from '../../../core/utils';

const DEFAULT_OPTIONS: ComposerOptions = {
  maxLength: 300,
  allowedEmbedTypes: ['app.bsky.embed.images', 'app.bsky.embed.video', 'app.bsky.embed.external'],
  enableThreadgate: true,
  defaultLanguages: ['en'],
  placeholder: "What's happening?"
};

export function useComposer(options: ComposerOptions = {}): UseComposerReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [state, setState] = useState<ComposerState>({
    text: '',
    facets: [],
    langs: config.defaultLanguages
  });
  
  const [mediaUploads, setMediaUploads] = useState<MediaUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Validation
  const validation = useMemo((): ComposerValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Text validation
    if (!state.text.trim()) {
      errors.push('Post cannot be empty');
    }
    
    if (state.text.length > config.maxLength!) {
      errors.push(`Post exceeds maximum length of ${config.maxLength} characters`);
    }
    
    // Character count warnings
    const remainingChars = config.maxLength! - state.text.length;
    if (remainingChars < 20 && remainingChars > 0) {
      warnings.push(`${remainingChars} characters remaining`);
    }
    
    // Media validation
    const pendingUploads = mediaUploads.filter(m => m.status === 'pending' || m.status === 'uploading');
    if (pendingUploads.length > 0) {
      warnings.push('Media uploads in progress');
    }
    
    const failedUploads = mediaUploads.filter(m => m.status === 'error');
    if (failedUploads.length > 0) {
      errors.push('Some media uploads failed');
    }
    
    // Facets validation
    if (state.facets && !postUtils.validators.validateFacets(state.facets, state.text)) {
      errors.push('Invalid text formatting detected');
    }
    
    return {
      isValid: errors.length === 0 && pendingUploads.length === 0,
      errors,
      warnings,
      characterCount: state.text.length,
      remainingCharacters: remainingChars
    };
  }, [state, mediaUploads, config.maxLength]);

  // Set text and parse facets
  const setText = useCallback((text: string) => {
    setState(prev => {
      const facets = parseFacets(text);
      return {
        ...prev,
        text,
        facets
      };
    });
    setError(undefined);
  }, []);

  // Add embed
  const addEmbed = useCallback((embed: PostEmbed) => {
    if (!config.allowedEmbedTypes?.includes(embed.$type)) {
      setError(`Embed type ${embed.$type} is not allowed`);
      return;
    }
    
    setState(prev => ({
      ...prev,
      embed
    }));
  }, [config.allowedEmbedTypes]);

  // Remove embed
  const removeEmbed = useCallback(() => {
    setState(prev => ({
      ...prev,
      embed: undefined
    }));
  }, []);

  // Add media
  const addMedia = useCallback(async (files: (File | { uri: string; type: string; name: string })[]) => {
    const newUploads: MediaUpload[] = files.map(file => ({
      id: helpers.stringHelpers.randomString(8),
      file,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      status: 'pending'
    }));
    
    setMediaUploads(prev => [...prev, ...newUploads]);
    
    // Start uploads
    for (const upload of newUploads) {
      uploadMedia(upload);
    }
  }, []);

  // Upload media
  const uploadMedia = useCallback(async (upload: MediaUpload) => {
    setMediaUploads(prev => prev.map(m => 
      m.id === upload.id ? { ...m, status: 'uploading', progress: 0 } : m
    ));
    
    try {
      // Validate file
      if ('size' in upload.file) {
        const validation = postUtils.validators.validateMedia(upload.file as File);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
      }
      
      // Upload to blob storage
      const formData = new FormData();
      if ('size' in upload.file) {
        formData.append('file', upload.file as File);
      } else {
        // Handle React Native file object
        const response = await fetch(upload.file.uri);
        const blob = await response.blob();
        formData.append('file', blob, upload.file.name);
      }
      
      const uploadResponse = await defaultApiClient.post('com.atproto.repo.uploadBlob', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          setMediaUploads(prev => prev.map(m => 
            m.id === upload.id ? { ...m, progress } : m
          ));
        }
      });
      
      // Update upload status
      setMediaUploads(prev => prev.map(m => 
        m.id === upload.id ? {
          ...m,
          status: 'completed',
          progress: 100,
          url: uploadResponse.blob.ref.$link
        } : m
      ));
      
      // Create embed if this is the first media
      const completedUploads = mediaUploads.filter(m => m.status === 'completed');
      if (completedUploads.length === 0) {
        createMediaEmbed([...completedUploads, { ...upload, status: 'completed', url: uploadResponse.blob.ref.$link }]);
      }
    } catch (error: any) {
      console.error('Failed to upload media:', error);
      setMediaUploads(prev => prev.map(m => 
        m.id === upload.id ? {
          ...m,
          status: 'error',
          error: error.message
        } : m
      ));
    }
  }, [mediaUploads]);

  // Create media embed
  const createMediaEmbed = useCallback((uploads: MediaUpload[]) => {
    const completedUploads = uploads.filter(u => u.status === 'completed' && u.url);
    
    if (completedUploads.length === 0) return;
    
    const imageUploads = completedUploads.filter(u => u.type === 'image');
    const videoUploads = completedUploads.filter(u => u.type === 'video');
    
    if (imageUploads.length > 0) {
      const embed: PostEmbed = {
        $type: 'app.bsky.embed.images',
        images: imageUploads.map(upload => ({
          alt: upload.alt || '',
          aspectRatio: upload.aspectRatio,
          image: {
            $type: 'blob',
            ref: { $link: upload.url! },
            mimeType: 'image/jpeg', // This should be determined from the file
            size: 0 // This should be the actual file size
          }
        }))
      };
      addEmbed(embed);
    } else if (videoUploads.length > 0) {
      const upload = videoUploads[0]; // Only one video per post
      const embed: PostEmbed = {
        $type: 'app.bsky.embed.video',
        video: {
          $type: 'blob',
          ref: { $link: upload.url! },
          mimeType: 'video/mp4', // This should be determined from the file
          size: 0 // This should be the actual file size
        },
        alt: upload.alt,
        aspectRatio: upload.aspectRatio
      };
      addEmbed(embed);
    }
  }, [addEmbed]);

  // Remove media
  const removeMedia = useCallback((id: string) => {
    setMediaUploads(prev => {
      const updated = prev.filter(m => m.id !== id);
      
      // Update embed if no media left
      if (updated.length === 0) {
        removeEmbed();
      } else {
        createMediaEmbed(updated);
      }
      
      return updated;
    });
  }, [removeEmbed, createMediaEmbed]);

  // Set reply
  const setReply = useCallback((reply: ComposerState['reply']) => {
    setState(prev => ({
      ...prev,
      reply
    }));
  }, []);

  // Set languages
  const setLanguages = useCallback((langs: string[]) => {
    setState(prev => ({
      ...prev,
      langs
    }));
  }, []);

  // Set threadgate
  const setThreadgate = useCallback((threadgate: ComposerState['threadgate']) => {
    if (!config.enableThreadgate) {
      setError('Threadgate is not enabled');
      return;
    }
    
    setState(prev => ({
      ...prev,
      threadgate
    }));
  }, [config.enableThreadgate]);

  // Submit post
  const submit = useCallback(async (): Promise<PostData> => {
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    
    setIsSubmitting(true);
    setError(undefined);
    
    try {
      const record = {
        $type: 'app.bsky.feed.post',
        text: state.text,
        createdAt: new Date().toISOString(),
        ...(state.facets && state.facets.length > 0 && { facets: state.facets }),
        ...(state.embed && { embed: state.embed }),
        ...(state.reply && { reply: state.reply }),
        ...(state.langs && { langs: state.langs }),
        ...(state.labels && { labels: state.labels }),
        ...(state.tags && { tags: state.tags })
      };
      
      const response = await defaultApiClient.post('com.atproto.repo.createRecord', {
        repo: defaultApiClient.session?.did,
        collection: 'app.bsky.feed.post',
        record
      });
      
      // Create threadgate if specified
      if (state.threadgate && config.enableThreadgate) {
        await defaultApiClient.post('com.atproto.repo.createRecord', {
          repo: defaultApiClient.session?.did,
          collection: 'app.bsky.feed.threadgate',
          record: {
            $type: 'app.bsky.feed.threadgate',
            post: response.uri,
            allow: state.threadgate.allow,
            createdAt: new Date().toISOString()
          }
        });
      }
      
      // Reset state after successful submission
      reset();
      
      // Return the created post (this would typically come from the API response)
      return {
        uri: response.uri,
        cid: response.cid,
        author: {
          did: defaultApiClient.session?.did || '',
          handle: defaultApiClient.session?.handle || '',
          displayName: defaultApiClient.session?.displayName,
          avatar: defaultApiClient.session?.avatar
        },
        record,
        replyCount: 0,
        repostCount: 0,
        likeCount: 0,
        quoteCount: 0,
        indexedAt: new Date().toISOString()
      } as PostData;
    } catch (error: any) {
      console.error('Failed to submit post:', error);
      setError(error.message || 'Failed to submit post');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [validation, state, config.enableThreadgate]);

  // Reset composer
  const reset = useCallback(() => {
    setState({
      text: '',
      facets: [],
      langs: config.defaultLanguages
    });
    setMediaUploads([]);
    setError(undefined);
  }, [config.defaultLanguages]);

  // Validate current state
  const validate = useCallback((): ComposerValidation => {
    return validation;
  }, [validation]);

  return {
    state,
    validation,
    isSubmitting,
    error,
    setText,
    addEmbed,
    removeEmbed,
    addMedia,
    removeMedia,
    setReply,
    setLanguages,
    setThreadgate,
    submit,
    reset,
    validate
  };
}

// Helper function to parse facets from text
function parseFacets(text: string) {
  const facets = [];
  
  // Parse mentions
  const mentionRegex = /@([a-zA-Z0-9._-]+(?:\.[a-zA-Z]{2,})?)/g;
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    facets.push({
      index: {
        byteStart: match.index,
        byteEnd: match.index + match[0].length
      },
      features: [{
        $type: 'app.bsky.richtext.facet#mention',
        did: `did:plc:${match[1]}` // This should be resolved to actual DID
      }]
    });
  }
  
  // Parse hashtags
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    facets.push({
      index: {
        byteStart: match.index,
        byteEnd: match.index + match[0].length
      },
      features: [{
        $type: 'app.bsky.richtext.facet#tag',
        tag: match[1]
      }]
    });
  }
  
  // Parse links
  const linkRegex = /(https?:\/\/[^\s]+)/g;
  
  while ((match = linkRegex.exec(text)) !== null) {
    facets.push({
      index: {
        byteStart: match.index,
        byteEnd: match.index + match[0].length
      },
      features: [{
        $type: 'app.bsky.richtext.facet#link',
        uri: match[0]
      }]
    });
  }
  
  return facets;
}

export default useComposer;