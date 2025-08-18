
import React, { useState, useEffect, useRef } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { AppBskyActorDefs } from '@atproto/api';
import { X, Camera, Loader2 } from 'lucide-react';

interface EditProfileModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose, onSuccess }) => {
  const { agent, session } = useAtp();
  const { toast } = useToast();

  const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [bannerPreview, setBannerPreview] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (session?.did) {
      setIsLoading(true);
      agent.getProfile({ actor: session.did })
        .then(({ data }) => {
          setProfile(data);
          setDisplayName(data.displayName || '');
          setDescription(data.description || '');
          setAvatarPreview(data.avatar);
          setBannerPreview(data.banner);
        })
        .catch(err => {
          console.error("Failed to fetch profile for editing:", err);
          setError("Could not load your profile data.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [agent, session?.did]);

  useEffect(() => {
    // Revoke object URLs on unmount to prevent memory leaks
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      if (bannerPreview && bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [avatarPreview, bannerPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1000000) { // 1MB limit
        toast({ title: "Image too large", description: "Please select an image smaller than 1MB.", variant: "destructive" });
        return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (type === 'avatar') {
      setAvatarFile(file);
      if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(previewUrl);
    } else {
      setBannerFile(file);
      if (bannerPreview && bannerPreview.startsWith('blob:')) URL.revokeObjectURL(bannerPreview);
      setBannerPreview(previewUrl);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let avatarBlob, bannerBlob;

      if (avatarFile) {
        const res = await agent.uploadBlob(new Uint8Array(await avatarFile.arrayBuffer()), { encoding: avatarFile.type });
        avatarBlob = res.data.blob;
      }
      if (bannerFile) {
        const res = await agent.uploadBlob(new Uint8Array(await bannerFile.arrayBuffer()), { encoding: bannerFile.type });
        bannerBlob = res.data.blob;
      }

      await agent.upsertProfile((existing) => {
        return {
          ...existing,
          displayName: displayName,
          description: description,
          avatar: avatarBlob || existing?.avatar,
          banner: bannerBlob || existing?.banner,
        };
      });

      toast({ title: "Profile updated successfully!" });
      onSuccess();
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({ title: "Error updating profile", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="bg-surface-2 p-8 rounded-xl"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
  }

  if (error) {
    return <div className="bg-surface-2 p-8 rounded-xl text-center text-error">{error}</div>
  }

  return (
    <div className="bg-surface-2 rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-surface-3 flex-shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-3 -ml-2"><X /></button>
                <h2 className="text-xl font-bold">Edit Profile</h2>
            </div>
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-on-primary font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save'}
            </button>
        </div>
        
        <div className="overflow-y-auto">
            <div>
                <div className="h-48 bg-surface-3 relative">
                    {bannerPreview && <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />}
                    <button
                        onClick={() => bannerInputRef.current?.click()}
                        className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                        aria-label="Change banner image"
                    >
                        <Camera className="w-8 h-8 text-white" />
                    </button>
                    <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/jpeg, image/png, image/gif" className="hidden" />
                </div>
                <div className="relative -mt-16 ml-6">
                    <div className="w-32 h-32 rounded-full border-4 border-surface-2 bg-surface-3 overflow-hidden group">
                        {avatarPreview && <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />}
                        <button
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                            aria-label="Change avatar image"
                        >
                            <Camera className="w-8 h-8 text-white" />
                        </button>
                        <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/jpeg, image/png, image/gif" className="hidden" />
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-4">
                <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-on-surface-variant mb-1">Display Name</label>
                    <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        maxLength={64}
                        className="w-full px-4 py-2 bg-surface-3 rounded-lg focus:ring-1 focus:ring-primary outline-none transition"
                    />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-on-surface-variant mb-1">Bio</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        maxLength={256}
                        rows={4}
                        className="w-full px-4 py-2 bg-surface-3 rounded-lg focus:ring-1 focus:ring-primary outline-none transition resize-none"
                    />
                </div>
            </div>
        </div>
    </div>
  );
};

export default EditProfileModal;
