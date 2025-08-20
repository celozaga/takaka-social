
import React, { useState, useEffect, useRef } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { AppBskyActorDefs } from '@atproto/api';
import { X, Camera, Loader2 } from 'lucide-react';
import { View, Text, TextInput, Pressable, Image, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';

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

  // Note: File input is web-specific.
  const avatarInputRef = Platform.OS === 'web' ? useRef<HTMLInputElement>(null) : null;
  
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
        .catch(err => setError("Could not load your profile data."))
        .finally(() => setIsLoading(false));
    }
  }, [getProfile, session?.did]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1000000) { // 1MB limit
        toast({ title: "Image too large", description: "Please select an image smaller than 1MB.", variant: "destructive" });
        return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (Platform.OS !== 'web') {
        toast({ title: "Not implemented", description: "Image upload is not implemented for native yet." });
        return;
    }
    setIsSaving(true);
    try {
      let avatarBlob;
      if (avatarFile) {
        const res = await agent.uploadBlob(new Uint8Array(await avatarFile.arrayBuffer()), { encoding: avatarFile.type });
        avatarBlob = res.data.blob;
      }
      await agent.upsertProfile((existing) => ({
        ...existing,
        displayName,
        description,
        avatar: avatarBlob || existing?.avatar,
      }));
      if (session?.did) clearProfile(session.did);
      toast({ title: "Profile updated successfully!" });
      onSuccess();
    } catch (error) {
      toast({ title: "Error updating profile", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#A8C7FA" /></View>
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
  }

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
                <Pressable onPress={onClose} style={styles.closeButton}><X color="#E2E2E6" /></Pressable>
                <Text style={styles.headerTitle}>Edit Profile</Text>
            </View>
            <Pressable onPress={handleSave} disabled={isSaving} style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
                {isSaving ? <ActivityIndicator color="#003258" /> : <Text style={styles.saveButtonText}>Save</Text>}
            </Pressable>
        </View>
        
        <ScrollView>
            <View style={styles.content}>
                <View style={styles.avatarContainer}>
                    <Pressable style={styles.avatarPressable} onPress={() => Platform.OS === 'web' && avatarInputRef?.current?.click()}>
                        {avatarPreview && <Image source={{ uri: avatarPreview }} style={styles.avatarImage} />}
                        <View style={styles.avatarOverlay}>
                            <Camera color="white" size={32} />
                        </View>
                    </Pressable>
                    {Platform.OS === 'web' && <input type="file" ref={avatarInputRef as any} onChange={handleFileChange} accept="image/jpeg, image/png, image/gif" style={{ display: 'none' }} />}
                </View>

                <View style={{ gap: 16 }}>
                    <View>
                        <Text style={styles.label}>Display Name</Text>
                        <TextInput
                            value={displayName}
                            onChangeText={setDisplayName}
                            maxLength={64}
                            style={styles.input}
                            placeholderTextColor="#8A9199"
                        />
                    </View>
                    <View>
                        <Text style={styles.label}>Bio</Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            maxLength={256}
                            multiline
                            numberOfLines={4}
                            style={[styles.input, styles.textArea]}
                            placeholderTextColor="#8A9199"
                        />
                    </View>
                </View>
            </View>
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    centered: { padding: 32, backgroundColor: '#1E2021', borderRadius: 12, alignItems: 'center' },
    errorText: { color: '#F2B8B5' },
    container: { backgroundColor: '#1E2021', borderRadius: 12, overflow: 'hidden', maxHeight: '90%', display: 'flex' as any, flexDirection: 'column' },
    header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
    closeButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#E2E2E6' },
    saveButton: { backgroundColor: '#A8C7FA', paddingVertical: 8, paddingHorizontal: 24, borderRadius: 999 },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { color: '#003258', fontWeight: 'bold' },
    content: { padding: 24 },
    avatarContainer: { alignItems: 'center', marginBottom: 24 },
    avatarPressable: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: '#1E2021', backgroundColor: '#2b2d2e', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    avatarOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
    label: { fontSize: 14, fontWeight: '500', color: '#C3C6CF', marginBottom: 4 },
    input: { width: '100%', padding: 12, backgroundColor: '#2b2d2e', borderRadius: 8, color: '#E2E2E6' },
    textArea: { height: 100, textAlignVertical: 'top' },
});

export default EditProfileModal;
