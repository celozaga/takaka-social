
import React, { useState, useRef, useEffect } from 'react';
import { useAtp } from '../context/AtpContext';
import { RichText, AppBskyActorDefs, AtUri } from '@atproto/api';
import { ImageUp, Send, X, Video, Globe } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface ComposerProps {
  onPostSuccess: () => void;
  onClose?: () => void;
  replyTo?: {
    uri: string;
    cid: string;
  };
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

const Composer: React.FC<ComposerProps> = ({ onPostSuccess, onClose, replyTo }) => {
  const { agent, session } = useAtp();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [langSearchTerm, setLangSearchTerm] = useState('');
  const langMenuRef = useRef<HTMLDivElement>(null);

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
    if (e.target.value.length <= MAX_CHARS) {
      setText(e.target.value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mediaFiles.length + files.length > MAX_IMAGES && !Array.from(files).some(f => f.type.startsWith('video'))) {
        toast({ title: `You can only select up to ${MAX_IMAGES} images.`, variant: 'destructive' });
        return;
    }

    if (mediaFiles.length > 0 || files.length > 1) {
        if (Array.from(files).some(f => f.type.startsWith('video') || f.type === 'image/gif')) {
            toast({ title: 'You can only upload one video or GIF at a time.', variant: 'destructive' });
            return;
        }
    }
    
    if (mediaFiles.some(mf => mf.type === 'video' || mf.type === 'gif')) {
        toast({ title: 'You cannot add more images with a video or GIF.', variant: 'destructive' });
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
        // Clean up object URL
        URL.revokeObjectURL(prev[index].preview);
        return newFiles;
    });
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handlePost = async () => {
    if (!text.trim() && mediaFiles.length === 0) {
        toast({ title: "Cannot create an empty post.", variant: "destructive" });
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

      if (mediaFiles.length > 0) {
        const videoFile = mediaFiles.find(mf => mf.type === 'video');
        if (videoFile) {
            const thumbBlob = await generateVideoThumbnail(videoFile.file);
            const videoBytes = new Uint8Array(await videoFile.file.arrayBuffer());

            const [thumbRes, videoRes] = await Promise.all([
                agent.uploadBlob(new Uint8Array(await thumbBlob.arrayBuffer()), { encoding: thumbBlob.type }),
                agent.uploadBlob(videoBytes, { encoding: videoFile.file.type })
            ]);

            postRecord.embed = {
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
            postRecord.embed = {
                $type: 'app.bsky.embed.images',
                images: imageEmbeds,
            };
        }
      }
      
      await agent.post(postRecord);

      toast({ title: replyTo ? "Reply sent!" : "Post published successfully!" });
      setText('');
      setMediaFiles([]);
      setSelectedLangs([]);
      onPostSuccess();
    } catch (error) {
      console.error('Failed to post:', error);
      toast({ title: "Failed to publish post.", description: "Please try again.", variant: "destructive" });
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
    <div className="relative bg-surface-2 p-4 rounded-xl border border-surface-3">
      {onClose && (
        <button onClick={onClose} className="absolute top-3 right-3 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-3 transition-colors z-10" aria-label="Close composer">
            <X className="w-5 h-5" />
        </button>
      )}
      <div className="flex gap-4">
        <img src={profile?.avatar || `https://picsum.photos/seed/${session?.did}/48`} alt="My avatar" className="w-12 h-12 rounded-full bg-surface-3"/>
        <div className="w-full">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder={replyTo ? "Write your reply..." : "What's happening?"}
            className="w-full bg-transparent text-lg resize-none outline-none placeholder-on-surface-variant"
            rows={replyTo ? 2 : 3}
          />
          {mediaFiles.length > 0 && (
            <div className={`mt-2 grid gap-2 ${mediaFiles.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
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
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-surface-3">
        <div className="flex items-center gap-2">
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
            <div className="relative" ref={langMenuRef}>
                 <button 
                    onClick={() => setIsLangMenuOpen(prev => !prev)} 
                    className="text-primary hover:text-primary/90 transition-colors p-2 rounded-full hover:bg-primary/20"
                    aria-label="Select languages"
                >
                    <Globe className="w-6 h-6"/>
                </button>
                {isLangMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-surface-3 rounded-lg shadow-lg z-20 border border-outline">
                         <input
                            type="text"
                            placeholder="Search languages..."
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
            <div className="flex items-center gap-1">
                {selectedLangs.map(lang => (
                    <span key={lang} className="text-xs font-semibold bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full">
                        {lang.toUpperCase()}
                    </span>
                ))}
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/gif, video/mp4, video/quicktime" 
                className="hidden"
                multiple={!hasVideoOrGif}
            />
        </div>
        <div className="flex items-center gap-4">
            <span className={`text-sm ${remainingChars < 20 ? 'text-yellow-400' : 'text-on-surface-variant'}`}>{remainingChars}</span>
            <button 
                onClick={handlePost} 
                disabled={isPosting || (!text.trim() && mediaFiles.length === 0)}
                className="bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-on-primary font-bold py-2 px-6 rounded-full transition duration-200 flex items-center gap-2"
            >
              {isPosting ? 'Posting...' : (replyTo ? 'Reply' : 'Post')}
              {!isPosting && <Send className="w-4 h-4"/>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Composer;
