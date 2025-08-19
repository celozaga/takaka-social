


import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { RichText, AppBskyActorDefs, AppBskyFeedDefs, AppBskyEmbedImages, AtUri } from '@atproto/api';
import { ImageUp, Send, X, Video, BadgeCheck } from 'lucide-react';
import { useToast } from '../ui/use-toast';

interface ComposerProps {
  onPostSuccess: () => void;
  onClose?: () => void;
  replyTo?: {
    uri: string;
    cid: string;
  };
  quoteOf?: AppBskyFeedDefs.PostView;
  initialText?: string;
}

interface MediaFile {
    file: File;
    preview: string;
    type: 'image' | 'video' | 'gif';
}

const MAX_CHARS = 300;
const MAX_IMAGES = 4;
const MAX_LANGS = 3;

// A list of common languages for the selector
const LANGUAGES = [
    { code: 'en', name: 'English' }, { code: 'es', name: 'Español' }, { code: 'pt', name: 'Português' },
    { code: 'fr', name: 'Français' }, { code: 'de', name: 'Deutsch' }, { code: 'it', name: 'Italiano' },
    { code: 'ja', name: '日本語' }, { code: 'ko', name: '한국어' }, { code: 'zh', name: '中文' },
    { code: 'ru', name: 'Русский' }, { code: 'ar', name: 'العربية' }, { code: 'hi', name: 'हिन्दी' },
    { code: 'nl', name: 'Nederlands' }, { code: 'sv', name: 'Svenska' }, { code: 'fi', name: 'Suomi' },
    { code: 'da', name: 'Dansk' }, { code: 'no', name: 'Norsk' }, { code: 'pl', name: 'Polski' },
    { code: 'tr', name: 'Türkçe' }, { code: 'uk', name: 'Українська' },
];

// Helper to generate a video thumbnail
const generateVideoThumbnail = (videoFile: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        video.src = URL.createObjectURL(videoFile);
        video.onloadeddata = () => {
            video.currentTime = 0;
        };
        video.onseeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context not available'));
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                URL.revokeObjectURL(video.src);
                if (!blob) return reject(new Error('Canvas toBlob failed'));
                resolve(blob);
            }, 'image/jpeg', 0.8);
        };
        video.onerror = (err) => {
             URL.revokeObjectURL(video.src);
             reject(err);
        }
    });
};

const CharacterCount: React.FC<{ remainingChars: number; max: number }> = ({ remainingChars, max }) => {
    const count = max - remainingChars;
    const progress = Math.min(count, max) / max;
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - progress * circumference;

    const progressColor = remainingChars < 0 ? 'text-error' : (remainingChars < 20 ? 'text-accent' : 'text-primary');

    return (
        <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="absolute w-full h-full" viewBox="0 0 40 40">
                <circle
                    className="text-surface-3"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    r={radius}
                    cx="20"
                    cy="20"
                />
                <circle
                    className={progressColor}
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="20"
                    cy="20"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.3s ease' }}
                />
            </svg>
            {remainingChars <= 20 && (
                <span className={`text-xs font-medium ${remainingChars < 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                    {remainingChars}
                </span>
            )}
        </div>
    );
};

const QuotedPostPreview: React.FC<{ post: AppBskyFeedDefs.PostView }> = ({ post }) => {
    const record = post.record as any;
    const firstImage = (AppBskyEmbedImages.isView(post.embed) && post.embed.images.length > 0)
        ? post.embed.images[0]
        : null;

    return (
        <div className="mt-2 border border-outline rounded-xl p-2">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <img src={post.author.avatar} className="w-4 h-4 rounded-full" />
                <span className="font-semibold">{post.author.displayName}</span>
                <span className="truncate">@{post.author.handle}</span>
            </div>
            <p className="text-sm text-on-surface line-clamp-3 mt-1">{record.text}</p>
            {firstImage && (
                <img src={firstImage.thumb} className="mt-2 w-16 h-16 object-cover rounded-lg" />
            )}
        </div>
    )
}

const Composer: React.FC<ComposerProps> = ({ onPostSuccess, onClose, replyTo, quoteOf, initialText }) => {
  const { agent, session } = useAtp();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [text, setText] = useState(initialText || '');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [langSearchTerm, setLangSearchTerm] = useState('');
  const langMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (session?.did) {
      agent.getProfile({ actor: session.did }).then(({ data }) => {
        setProfile(data);
      }).catch(err => {
        console.error("Failed to fetch user profile:", err);
      });
    }
  }, [agent, session?.did]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mediaFiles.length + files.length > MAX_IMAGES && !Array.from(files).some(f => f.type.startsWith('video'))) {
        toast({ title: t('composer.toast.maxImages', { max: MAX_IMAGES }), variant: 'destructive' });
        return;
    }

    if (mediaFiles.length > 0 || files.length > 1) {
        if (Array.from(files).some(f => f.type.startsWith('video') || f.type === 'image/gif')) {
            toast({ title: t('composer.toast.oneVideoOrGif'), variant: 'destructive' });
            return;
        }
    }
    
    if (mediaFiles.some(mf => mf.type === 'video' || mf.type === 'gif')) {
        toast({ title: t('composer.toast.noMoreImagesWithVideoOrGif'), variant: 'destructive' });
        return;
    }

    const newMediaFiles: MediaFile[] = [...mediaFiles];
    Array.from(files).forEach(file => {
        const type = file.type.startsWith('video') ? 'video' : (file.type === 'image/gif' ? 'gif' : 'image');
        newMediaFiles.push({ file, preview: URL.createObjectURL(file), type });
    });
    setMediaFiles(newMediaFiles);
  };
  
  const removeMedia = (index: number) => {
    setMediaFiles(prev => {
        const newFiles = prev.filter((_, i) => i !== index);
        URL.revokeObjectURL(prev[index].preview);
        return newFiles;
    });
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handlePost = async () => {
    if ((!text.trim() && mediaFiles.length === 0 && !quoteOf) || (text.length > MAX_CHARS)) {
        toast({ title: text.length > MAX_CHARS ? "Post is too long." : t('composer.toast.emptyPost'), variant: "destructive" });
        return;
    }
    setIsPosting(true);

    try {
      const rt = new RichText({ text });
      await rt.detectFacets(agent);

      let postRecord: any = {
        $type: 'app.bsky.feed.post',
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
      };
      
      if (selectedLangs.length > 0) {
        postRecord.langs = selectedLangs;
      }
      
      if (replyTo) {
          postRecord.reply = {
              root: replyTo,
              parent: replyTo
          }
      }

      let mediaEmbed;
      if (mediaFiles.length > 0) {
        const videoFile = mediaFiles.find(mf => mf.type === 'video');
        if (videoFile) {
            const thumbBlob = await generateVideoThumbnail(videoFile.file);
            const videoBytes = new Uint8Array(await videoFile.file.arrayBuffer());
            const [thumbRes, videoRes] = await Promise.all([
                agent.uploadBlob(new Uint8Array(await thumbBlob.arrayBuffer()), { encoding: thumbBlob.type }),
                agent.uploadBlob(videoBytes, { encoding: videoFile.file.type })
            ]);
            mediaEmbed = {
                $type: 'app.bsky.embed.video',
                video: videoRes.data.blob,
                thumb: thumbRes.data.blob,
                aspectRatio: { width: 500, height: 500 } // Placeholder
            };
        } else {
            const imageEmbeds = await Promise.all(mediaFiles.map(async mf => {
                const fileBytes = new Uint8Array(await mf.file.arrayBuffer());
                const blobRes = await agent.uploadBlob(fileBytes, { encoding: mf.file.type });
                return { image: blobRes.data.blob, alt: '' };
            }));
            mediaEmbed = {
                $type: 'app.bsky.embed.images',
                images: imageEmbeds,
            };
        }
      }
      
      if (quoteOf) {
        const quoteEmbed = {
            $type: 'app.bsky.embed.record',
            record: { cid: quoteOf.cid, uri: quoteOf.uri },
        };
        if (mediaEmbed) {
            postRecord.embed = {
                $type: 'app.bsky.embed.recordWithMedia',
                record: quoteEmbed,
                media: mediaEmbed,
            };
        } else {
            postRecord.embed = quoteEmbed;
        }
      } else if (mediaEmbed) {
        postRecord.embed = mediaEmbed;
      }
      
      await agent.post(postRecord);

      toast({ title: replyTo ? t('composer.toast.replySuccess') : t('composer.toast.postSuccess') });
      setText('');
      setMediaFiles([]);
      setSelectedLangs([]);
      onPostSuccess();
    } catch (error) {
      console.error('Failed to post:', error);
      toast({ title: t('composer.toast.postFailed'), description: t('common.tryAgain'), variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  const handleLangSelect = (code: string) => {
    setSelectedLangs(prev => {
        if (prev.includes(code)) {
            return prev.filter(lang => lang !== code);
        }
        if (prev.length < MAX_LANGS) {
            return [...prev, code];
        }
        return prev;
    });
  }
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
            setIsLangMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLangs = LANGUAGES.filter(lang => lang.name.toLowerCase().includes(langSearchTerm.toLowerCase()));
  const remainingChars = MAX_CHARS - text.length;
  const hasVideoOrGif = mediaFiles.some(mf => mf.type === 'video' || mf.type === 'gif');

  return (
    <div className="flex flex-col h-full w-full bg-surface-1">
        <header className="flex-shrink-0 flex items-center justify-between p-2 md:p-4">
            <button onClick={onClose} className="text-primary font-medium px-4 py-2 rounded-full hover:bg-primary/10 transition-colors">
                Cancel
            </button>
            <button
                onClick={handlePost}
                disabled={isPosting || (!text.trim() && mediaFiles.length === 0 && !quoteOf) || text.length > MAX_CHARS}
                className="bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-on-primary font-bold py-1.5 px-5 rounded-full transition duration-200 flex items-center gap-2 text-sm"
            >
                {isPosting ? t('composer.posting') : (replyTo ? t('common.reply') : t('common.post'))}
                {!isPosting && <Send className="w-4 h-4" />}
            </button>
        </header>

        <main className="flex-1 flex gap-4 p-4 overflow-y-auto">
            <img src={profile?.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') || `https://picsum.photos/seed/${session?.did}/48`} alt="My avatar" className="w-12 h-12 rounded-full bg-surface-3 flex-shrink-0" loading="lazy"/>
            <div className="w-full flex flex-col">
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    placeholder={replyTo ? t('composer.replyPlaceholder') : (quoteOf ? "Add a comment..." : t('composer.placeholder'))}
                    className="w-full bg-transparent text-xl resize-none outline-none placeholder-on-surface-variant flex-1 min-h-[100px]"
                    autoFocus
                />

                {quoteOf && <QuotedPostPreview post={quoteOf} />}

                {mediaFiles.length > 0 && (
                    <div className={`mt-4 grid gap-2 ${mediaFiles.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {mediaFiles.map((mf, index) => (
                            <div key={index} className="relative group">
                                {mf.type === 'video' ? (
                                    <video src={mf.preview} controls className="rounded-lg w-full h-auto object-contain max-h-72" />
                                ) : (
                                    <img src={mf.preview} alt={`Preview ${index}`} className="rounded-lg w-full h-auto object-cover max-h-72"/>
                                )}
                                <button onClick={() => removeMedia(index)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/75 transition-colors opacity-0 group-hover:opacity-100">
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
        
        <footer className="flex-shrink-0 flex justify-between items-center p-2 border-t border-surface-3">
            <div className="flex items-center gap-1">
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="text-primary hover:text-primary/90 transition-colors p-2 rounded-full hover:bg-primary/20 disabled:text-on-surface-variant/50 disabled:cursor-not-allowed"
                    disabled={mediaFiles.length >= MAX_IMAGES || hasVideoOrGif}
                    aria-label="Upload image"
                >
                    <ImageUp className="w-6 h-6"/>
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="text-primary hover:text-primary/90 transition-colors p-2 rounded-full hover:bg-primary/20 disabled:text-on-surface-variant/50 disabled:cursor-not-allowed"
                    disabled={mediaFiles.length > 0}
                    aria-label="Upload video"
                >
                    <Video className="w-6 h-6"/>
                </button>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/png, image/jpeg, image/gif, video/mp4, video/quicktime" 
                    className="hidden"
                    multiple={!hasVideoOrGif}
                />
            </div>

            <div className="flex items-center gap-2">
                <div className="relative" ref={langMenuRef}>
                    <button onClick={() => setIsLangMenuOpen(prev => !prev)} className="text-primary text-sm font-medium px-3 py-1 rounded-full hover:bg-primary/10">
                        {selectedLangs.length > 0 ? LANGUAGES.find(l => l.code === selectedLangs[0])?.name : 'English'}
                        {selectedLangs.length > 1 && ` +${selectedLangs.length - 1}`}
                    </button>
                    {isLangMenuOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-surface-3 rounded-lg z-20 shadow-lg">
                            <input
                                type="text"
                                placeholder={t('composer.searchLanguages')}
                                value={langSearchTerm}
                                onChange={(e) => setLangSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 bg-surface-2 border-b border-outline outline-none rounded-t-lg"
                            />
                            <ul className="max-h-60 overflow-y-auto">
                                {filteredLangs.map(lang => (
                                    <li key={lang.code}>
                                        <button
                                            onClick={() => handleLangSelect(lang.code)}
                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-2 ${selectedLangs.includes(lang.code) ? 'bg-primary-container text-on-primary-container' : 'text-on-surface'}`}
                                            disabled={!selectedLangs.includes(lang.code) && selectedLangs.length >= MAX_LANGS}
                                        >
                                            {lang.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="w-px h-5 bg-surface-3"></div>
                <CharacterCount remainingChars={remainingChars} max={MAX_CHARS} />
            </div>
        </footer>
    </div>
  );
};

export default Composer;