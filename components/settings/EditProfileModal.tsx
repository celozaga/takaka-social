
import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '@/components/shared';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { useTranslation } from 'react-i18next';
import { AppBskyActorDefs } from '@atproto/api';
import { X, Camera } from 'lucide-react';
import { View, Text, TextInput, Pressable, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import * as ImagePicker from 'expo-image-picker';

interface EditProfileModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose, onSuccess }) => {
  const { agent, session } = useAtp();
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { getProfile, clearProfile } = useProfileCache();

  const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

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
  
  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > 1000000) { // 1MB limit
        toast({ title: t('editProfile.toast.imageTooLarge'), description: t('editProfile.toast.imageTooLargeDescription'), variant: "destructive" });
        return;
    }
    
    setAvatarPreview(asset.uri);
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    setAvatarBlob(blob);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let avatarUploadResult: any;
      if (avatarBlob) {
        const res = await agent.uploadBlob(new Uint8Array(await avatarBlob.arrayBuffer()), { encoding: avatarBlob.type });
        avatarUploadResult = res.data.blob;
      }
      await agent.upsertProfile((existing) => ({
        ...existing,
        displayName,
        description,
        avatar: avatarUploadResult || existing?.avatar,
      }));
      if (session?.did) clearProfile(session.did);
      toast({ title: t('editProfile.toast.success') });
      onSuccess();
    } catch (error) {
      console.error("Failed to save profile:", error);
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
                    <Pressable style={styles.avatarPressable} onPress={pickAvatar}>
                        {avatarPreview && <Image source={{ uri: avatarPreview }} style={styles.avatarImage} />}
                        <View style={styles.avatarOverlay}>
                            <Camera color="white" size={32} />
                        </View>
                    </Pressable>
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

const createStyles = (theme: any) => StyleSheet.create({
    centered: { padding: theme.spacing.xxl, backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.radius.lg, alignItems: 'center' },
    errorText: { color: theme.colors.error },
    container: { backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.radius.lg, overflow: 'hidden', maxHeight: '90%', display: 'flex' as any, flexDirection: 'column' },
    header: { padding: theme.spacing.l, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
    closeButton: { padding: theme.spacing.s, marginLeft: -theme.spacing.s },
    headerTitle: { ...theme.typography.titleLarge, color: theme.colors.onSurface },
    saveButton: { backgroundColor: theme.colors.primary, paddingVertical: theme.spacing.s, paddingHorizontal: theme.spacing.xl, borderRadius: theme.radius.full },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { color: theme.colors.onPrimary, fontWeight: 'bold' },
    content: { padding: theme.spacing.xl },
    avatarContainer: { alignItems: 'center', marginBottom: theme.spacing.xl },
    avatarPressable: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: theme.colors.surfaceContainer, backgroundColor: theme.colors.surfaceContainerHigh, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    avatarOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
    label: { ...theme.typography.labelLarge, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.xs },
    input: { width: '100%', padding: theme.spacing.m, backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: theme.radius.md, color: theme.colors.onSurface, fontSize: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
});

export default EditProfileModal;
