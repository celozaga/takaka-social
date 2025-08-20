import React, { useState, useEffect, useRef } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { AppBskyActorDefs } from '@atproto/api';
import { X, Camera, Loader2 } from 'lucide-react';

interface EditProfileModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose, onSuccess }) => {
  const { agent, session } = useAtp();
  const { toast } = useToast();
  const { getProfile, clearProfile } = useProfileCache();

  const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (session?.did) {
      setIsLoading(true);
      getProfile(session.did)
        .then((data) => {
          setProfile(data);
          setDisplayName(data.displayName || '');
          setDescription(data.description || '');
          setAvatarPreview(data.avatar);
        })
        .catch(err => {
          console.error("Failed to fetch profile for editing:", err);
          setError("Could not load your profile data.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [getProfile, session?.did]);

  useEffect(() => {
    // Revoke object URLs on unmount to prevent memory leaks
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1000000) { // 1MB limit
        toast({ title: "Image too large", description: "Please select an image smaller than 1MB.", variant: "destructive" });
        return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(previewUrl);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let avatarBlob;

      if (avatarFile) {
        const res = await agent.uploadBlob(new Uint8Array(await avatarFile.arrayBuffer()), { encoding: avatarFile.type });
        avatarBlob = res.data.blob;
      }

      await agent.upsertProfile((existing) => {
        return {
          ...existing,
          displayName: displayName,
          description: description,
          avatar: avatarBlob || existing?.avatar,
          banner: existing?.banner, // Keep existing banner
        };
      });

      // Invalidate the cache for our own profile
      if (session?.did) {
        clearProfile(session.did);
      }

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
        <div className="p-4 flex items-center justify-between flex-shrink-0">
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
        
        <div className="overflow-y-auto p-6">
            <div className="flex justify-center mb-6">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-surface-2 bg-surface-3 overflow-hidden group">
                        {avatarPreview && <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />}
                        <button
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                            aria-label="Change avatar image"
                        >
                            <Camera className="w-8 h-8 text-white" />
                        </button>
                        <input type="file" ref={avatarInputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/gif" className="hidden" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
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
