
import React, { useState, useEffect, useRef } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { useTranslation } from 'react-i18next';
import { AppBskyActorDefs } from '@atproto/api';
import { X, Camera } from 'lucide-react';
import { View, Text, TextInput, Pressable, Image, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { theme } from '@/lib/theme';

interface EditProfileModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose, onSuccess }) => {
  const { agent, session } = useAtp();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { getProfile, clearProfile } = useProfileCache();

  const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

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
        .catch(err => setError(t('editProfile.loadingError')))
        .finally(() => setIsLoading(false));
    }
  }, [getProfile, session?.did, t]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1000000) { // 1MB limit
        toast({ title: t('editProfile.toast.imageTooLarge'), description: t('editProfile.toast.imageTooLargeDescription'), variant: "destructive" });
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
      toast({ title: t('editProfile.toast.success') });
      onSuccess();
    } catch (error) {
      toast({ title: t('editProfile.toast.error'), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.onSurface} /></View>
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
  }

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.l}}>
                <Pressable onPress={onClose} style={styles.closeButton}><X color={theme.colors.onSurface} /></Pressable>
                <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
            </View>
            <Pressable onPress={handleSave} disabled={isSaving} style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
                {isSaving ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={styles.saveButtonText}>{t('common.save')}</Text>}
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

                <View style={{ gap: theme.spacing.l }}>
                    <View>
                        <Text style={styles.label}>{t('editProfile.displayName')}</Text>
                        <TextInput
                            value={displayName}
                            onChangeText={setDisplayName}
                            maxLength={64}
                            style={styles.input}
                            placeholderTextColor={theme.colors.onSurfaceVariant}
                        />
                    </View>
                    <View>
                        <Text style={styles.label}>{t('editProfile.bio')}</Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            maxLength={256}
                            multiline
                            numberOfLines={4}
                            style={[styles.input, styles.textArea]}
                            placeholderTextColor={theme.colors.onSurfaceVariant}
                        />
                    </View>
                </View>
            </View>
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    centered: { padding: theme.spacing.xxl, backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.shape.large, alignItems: 'center' },
    errorText: { color: theme.colors.error },
    container: { backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.shape.large, overflow: 'hidden', maxHeight: '90%', display: 'flex' as any, flexDirection: 'column' },
    header: { padding: theme.spacing.l, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
    closeButton: { padding: theme.spacing.s, marginLeft: -theme.spacing.s },
    headerTitle: { ...theme.typography.titleLarge, color: theme.colors.onSurface },
    saveButton: { backgroundColor: theme.colors.primary, paddingVertical: theme.spacing.s, paddingHorizontal: theme.spacing.xl, borderRadius: theme.shape.full },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { color: theme.colors.onPrimary, fontWeight: 'bold' },
    content: { padding: theme.spacing.xl },
    avatarContainer: { alignItems: 'center', marginBottom: theme.spacing.xl },
    avatarPressable: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: theme.colors.surfaceContainer, backgroundColor: theme.colors.surfaceContainerHigh, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    avatarOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
    label: { ...theme.typography.labelLarge, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.xs },
    input: { width: '100%', padding: theme.spacing.m, backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: theme.shape.medium, color: theme.colors.onSurface, fontSize: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
});

export default EditProfileModal;
