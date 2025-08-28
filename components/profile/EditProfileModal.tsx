import React, { useState, useEffect, useRef } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '@/components/shared';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { useTranslation } from 'react-i18next';
import { AppBskyActorDefs } from '@atproto/api';
import { X, Camera } from 'lucide-react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { OptimizedImage } from '../ui';
import { useTheme } from '@/hooks/useTheme';
import * as ImagePicker from 'expo-image-picker';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { PrimaryButton, SecondaryButton } from '@/components/shared';
import { useDebouncedAction } from '@/hooks/useDebounce';

interface EditProfileModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose, onSuccess }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { agent, session } = useAtp();
  const { toast } = useToast();
  const { requireAuth } = useAuthGuard();
  const { t } = useTranslation();
  const { getProfile, clearProfile } = useProfileCache();

  // Verificar autenticação ao montar o componente
  useEffect(() => {
    if (!requireAuth('edit_profile')) {
      onClose();
    }
  }, [requireAuth, onClose]);

  const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);

  const saveProfile = async () => {
    if (!agent || !session?.did) {
      toast({ title: t('editProfile.toast.error'), description: t('editProfile.toast.notAuthenticated'), variant: "destructive" });
      return;
    }

    try {
      let avatarRef;
      if (avatarBlob) {
        const uploadResponse = await agent.uploadBlob(avatarBlob, { encoding: 'image/jpeg' });
        avatarRef = uploadResponse.data.blob;
      }

      await agent.upsertProfile((existing) => {
        return {
          ...existing,
          displayName: displayName.trim(),
          description: description.trim(),
          ...(avatarRef && { avatar: avatarRef }),
        };
      });

      clearProfile(session.did);
      toast({ title: t('editProfile.toast.success'), description: t('editProfile.toast.profileUpdated'), variant: "default" });
      onSuccess();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: t('editProfile.toast.error'), description: t('editProfile.toast.updateFailed'), variant: "destructive" });
    }
  };

  const { execute: executeSave, isLoading: isSavingDebounced } = useDebouncedAction(saveProfile, 1000);

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
        </View>
        
        <ScrollView>
            <View style={styles.content}>
                <View style={styles.avatarContainer}>
                    <Pressable style={styles.avatarPressable} onPress={pickAvatar}>
                        {avatarPreview && <OptimizedImage source={{ uri: avatarPreview }} style={styles.avatarImage} />}
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

        <View style={styles.modalActions}>
            <SecondaryButton
                title={t('common.cancel')}
                onPress={onClose}
                style={styles.modalButton}
            />
            <PrimaryButton
                title={t('common.save')}
                onPress={executeSave}
                disabled={!displayName.trim() || isLoading || isSavingDebounced}
                loading={isSavingDebounced}
                style={styles.modalButton}
            />
        </View>
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
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', padding: theme.spacing.l, backgroundColor: theme.colors.surfaceContainerHigh, borderTopWidth: 1, borderTopColor: theme.colors.surfaceContainer },
    modalButton: { flex: 1, marginHorizontal: theme.spacing.xs },
});

export default EditProfileModal;