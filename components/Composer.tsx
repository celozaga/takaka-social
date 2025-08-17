import React, { useState, useRef, useEffect } from 'react';
import { useAtp } from '../context/AtpContext';
import { RichText, AppBskyActorDefs, AtUri } from '@atproto/api';
import { ImageUp, Send, X } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface ComposerProps {
  onPostSuccess: () => void;
  onClose?: () => void;
  replyTo?: {
    uri: string;
    cid: string;
  };
}

const MAX_CHARS = 300;

const Composer: React.FC<ComposerProps> = ({ onPostSuccess, onClose, replyTo }) => {
  const { agent, session } = useAtp();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handlePost = async () => {
    if (!text.trim() && !imageFile) {
        toast({ title: "Cannot create an empty post.", variant: "destructive" });
        return;
    }
    setIsPosting(true);

    try {
      const rt = new RichText({ text });
      await rt.detectFacets(agent); // automatically detects mentions and links

      let postRecord: any = {
        $type: 'app.bsky.feed.post',
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
      };
      
      if (replyTo) {
          const parentUri = new AtUri(replyTo.uri);
          // For simplicity, we'll set root to parent. A more complex client
          // would trace the reply chain up to the original root.
          postRecord.reply = {
              root: replyTo,
              parent: replyTo
          }
      }

      if (imageFile) {
        const fileBytes = new Uint8Array(await imageFile.arrayBuffer());
        const blobResponse = await agent.uploadBlob(fileBytes, {
          encoding: imageFile.type,
        });

        postRecord.embed = {
          $type: 'app.bsky.embed.images',
          images: [{ image: blobResponse.data.blob, alt: '' }],
        };
      }
      
      await agent.post(postRecord);

      toast({ title: replyTo ? "Reply sent!" : "Post published successfully!" });
      setText('');
      removeImage();
      onPostSuccess();
    } catch (error) {
      console.error('Failed to post:', error);
      toast({ title: "Failed to publish post.", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  const remainingChars = MAX_CHARS - text.length;

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
          {imagePreview && (
            <div className="relative mt-2">
                <img src={imagePreview} alt="Image preview" className="rounded-lg max-h-72 w-auto"/>
                <button onClick={removeImage} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/75 transition-colors">
                    <X className="w-4 h-4"/>
                </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-surface-3">
        <button onClick={() => fileInputRef.current?.click()} className="text-primary hover:text-primary/90 transition-colors p-2 rounded-full hover:bg-primary/20">
            <ImageUp className="w-6 h-6"/>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" className="hidden"/>
        </button>
        <div className="flex items-center gap-4">
            <span className={`text-sm ${remainingChars < 20 ? 'text-yellow-400' : 'text-on-surface-variant'}`}>{remainingChars}</span>
            <button 
                onClick={handlePost} 
                disabled={isPosting || (!text.trim() && !imageFile)}
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