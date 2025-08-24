
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { RichText,AppBskyActorDefs } from '@atproto/api';
import { ImageUp, Send, X, Video } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView, Modal, Platform } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@/lib/theme';
import * as ImagePicker from 'expo-image-picker';

interface ComposerProps {
  onPostSuccess: () => void;
  onClose?: () => void;
  replyTo?: {
    uri: string;
    cid: string;
  };
  initialText?: string;
}

interface MediaFile {
    asset: ImagePicker.ImagePickerAsset;
    preview: string;
    type: 'image' | 'video' | 'gif';
}

const MAX_CHARS = 300;
const MAX_IMAGES = 4;
const MAX_LANGS = 3;

const LANGUAGES = [
    { code: 'en', name: 'English' }, { code: 'es', name: 'Español' }, { code: 'pt', name: 'Português' },
    { code: 'fr', name: 'Français' }, { code: 'de', name: 'Deutsch' }, { code: 'it', name: 'Italiano' },
    { code: 'ja', name: '日本語' }, { code: 'ko', name: '한국어' }, { code: 'zh', name: '中文' },
    { code: 'ru', name: 'Русский' }, { code: 'ar', name: 'العربية' }, { code: 'hi', name: 'हिन्दी' },
    { code: 'nl', name: 'Nederlands' }, { code: 'sv', name: 'Svenska' }, { code: 'fi', name: 'Suomi' },
    { code: 'da', name: 'Dansk' }, { code: 'no', name: 'Norsk' }, { code: 'pl', name: 'Polski' },
    { code: 'tr', name: 'Türkçe' }, { code: 'uk', name: 'Українська' },
];

const CharacterCount: React.FC<{ remainingChars: number }> = ({ remainingChars }) => {
    const color = remainingChars < 0 ? theme.colors.error : (remainingChars < 20 ? theme.colors.primary : theme.colors.onSurfaceVariant);
    if (remainingChars > 20) return null;

    return (
        <Text style={{ color, fontSize: 14, fontWeight: '500' }}>
            {remainingChars}
        </Text>
    );
};

const Composer: React.FC<ComposerProps> = ({ onPostSuccess, onClose, replyTo, initialText }) => {
  const { agent, session } = useAtp();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [text, setText] = useState(initialText || '');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [langSearchTerm, setLangSearchTerm] = useState('');

  useEffect(() => {
    if (session?.did) {
      agent.getProfile({ actor: session.did }).then(({ data }) => {
        setProfile(data);
      }).catch(err => {
        console.error("Failed to fetch user profile:", err);
      });
    }
  }, [agent, session?.did]);

  const pickMedia = async (options: ImagePicker.ImagePickerOptions) => {
    let result = await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled) return;

    const hasVideoOrGif = mediaFiles.some(mf => mf.type === 'video' || mf.type === 'gif');
    if (hasVideoOrGif && result.assets.length > 0) {
        toast({ title: t('composer.toast.noMoreImagesWithVideoOrGif'), variant: 'destructive' });
        return;
    }

    const newMediaFiles: MediaFile[] = [...mediaFiles];
    for (const asset of result.assets) {
        if (newMediaFiles.length >= MAX_IMAGES) {
            toast({ title: t('composer.toast.maxImages', { max: MAX_IMAGES }), variant: 'destructive' });
            break;
        }
        const type = asset.type === 'video' ? 'video' : (asset.mimeType === 'image/gif' ? 'gif' : 'image');
        
        if ((type === 'video' || type === 'gif') && (newMediaFiles.length > 0 || result.assets.length > 1)) {
            toast({ title: t('composer.toast.oneVideoOrGif'), variant: 'destructive' });
            if (newMediaFiles.length === 0) {
                newMediaFiles.push({ preview: asset.uri, type, asset });
            }
            break; 
        }

        newMediaFiles.push({ preview: asset.uri, type, asset });
    }
    setMediaFiles(newMediaFiles);
  };
  
  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (mediaFiles.length === 0 && !replyTo) {
        toast({ title: t('composer.toast.mediaRequired'), variant: "destructive" });
        return;
    }
    if (text.length > MAX_CHARS) {
        toast({ title: t('composer.toast.postTooLong'), variant: "destructive" });
        return;
    }
    if (!text.trim() && mediaFiles.length === 0 && replyTo) {
        toast({ title: t('composer.toast.emptyPost'), variant: "destructive" });
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
        
        if (mediaFiles.length > 0) {
            const imageEmbeds = await Promise.all(mediaFiles.map(async mf => {
                const response = await fetch(mf.asset.uri);
                const blob = await response.blob();
                const fileBytes = new Uint8Array(await blob.arrayBuffer());
                const blobRes = await agent.uploadBlob(fileBytes, { encoding: blob.type });
                return { image: blobRes.data.blob, alt: '' };
            }));
            postRecord.embed = {
                $type: 'app.bsky.embed.images',
                images: imageEmbeds,
            };
        }
        
        await agent.post(postRecord);

        toast({ title: replyTo ? t('composer.toast.replySuccess') : t('composer.toast.postSuccess') });
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
        if (prev.includes(code)) return prev.filter(lang => lang !== code);
        if (prev.length < MAX_LANGS) return [...prev, code];
        return prev;
    });
  }

  const filteredLangs = LANGUAGES.filter(lang => lang.name.toLowerCase().includes(langSearchTerm.toLowerCase()));
  const remainingChars = MAX_CHARS - text.length;
  const hasVideoOrGif = mediaFiles.some(mf => mf.type === 'video' || mf.type === 'gif');
  const isPostButtonDisabled = isPosting ||
    (replyTo ? (!text.trim() && mediaFiles.length === 0) : mediaFiles.length === 0) ||
    text.length > MAX_CHARS;

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
                onPress={handlePost}
                disabled={isPostButtonDisabled}
                style={[styles.postButton, isPostButtonDisabled && styles.postButtonDisabled]}
            >
                {isPosting ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Send color={theme.colors.onPrimary} size={16} />}
                <Text style={styles.postButtonText}>
                    {isPosting ? t('composer.posting') : (replyTo ? t('common.reply') : t('common.post'))}
                </Text>
            </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.main}>
            <Image 
                source={{ uri: profile?.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') || `https://picsum.photos/seed/${session?.did}/48` }} 
                style={styles.avatar} 
            />
            <View style={{ flex: 1 }}>
                <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder={replyTo ? t('composer.replyPlaceholder') : t('composer.placeholder')}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    style={styles.textInput}
                    multiline
                    autoFocus
                />

                {mediaFiles.length > 0 && (
                    <View style={styles.mediaGrid}>
                        {mediaFiles.map((mf, index) => (
                            <View key={index} style={[styles.mediaItem, { width: mediaFiles.length > 1 ? '48%' : '100%' }]}>
                                <Image source={{ uri: mf.preview }} style={styles.mediaPreview} />
                                <Pressable onPress={() => removeMedia(index)} style={styles.removeMediaButton}>
                                    <X color="white" size={16} />
                                </Pressable>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
        
        <View style={styles.footer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                <Pressable 
                    onPress={() => pickMedia({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: MAX_IMAGES })} 
                    style={styles.iconButton}
                    disabled={mediaFiles.length >= MAX_IMAGES || hasVideoOrGif}
                >
                    <ImageUp color={theme.colors.primary} size={24} />
                </Pressable>
                <Pressable 
                    onPress={() => pickMedia({ mediaTypes: ImagePicker.MediaTypeOptions.Videos })} 
                    style={styles.iconButton}
                    disabled={mediaFiles.length > 0}
                >
                    <Video color={theme.colors.primary} size={24} />
                </Pressable>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s }}>
                <Pressable onPress={() => setIsLangMenuOpen(true)} style={styles.langButton}>
                    <Text style={styles.langButtonText}>
                        {selectedLangs.length > 0 ? LANGUAGES.find(l => l.code === selectedLangs[0])?.name : 'English'}
                        {selectedLangs.length > 1 && ` +${selectedLangs.length - 1}`}
                    </Text>
                </Pressable>
                <View style={styles.divider} />
                <CharacterCount remainingChars={remainingChars} />
            </View>
        </View>

         <Modal
            transparent
            visible={isLangMenuOpen}
            onRequestClose={() => setIsLangMenuOpen(false)}
            animationType="fade"
         >
            <Pressable style={styles.langModalBackdrop} onPress={() => setIsLangMenuOpen(false)}>
                <View style={styles.langModalContent}>
                     <TextInput
                        placeholder={t('composer.searchLanguages')}
                        value={langSearchTerm}
                        onChangeText={setLangSearchTerm}
                        style={styles.langSearchInput}
                     />
                     <ScrollView>
                        {filteredLangs.map(lang => (
                            <Pressable
                                key={lang.code}
                                onPress={() => handleLangSelect(lang.code)}
                                style={[styles.langOption, selectedLangs.includes(lang.code) && styles.langOptionSelected]}
                                disabled={!selectedLangs.includes(lang.code) && selectedLangs.length >= MAX_LANGS}
                            >
                                <Text style={selectedLangs.includes(lang.code) ? styles.langOptionTextSelected : styles.langOptionText}>
                                    {lang.name}
                                </Text>
                            </Pressable>
                        ))}
                     </ScrollView>
                </View>
            </Pressable>
         </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surfaceContainer },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.s, flexShrink: 0 },
    cancelButton: { paddingHorizontal: theme.spacing.l, paddingVertical: theme.spacing.s },
    cancelButtonText: { color: theme.colors.primary, fontWeight: '500' },
    postButton: { backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, paddingVertical: 6, paddingHorizontal: 20, borderRadius: theme.shape.full },
    postButtonDisabled: { opacity: 0.5 },
    postButtonText: { color: theme.colors.onPrimary, fontWeight: 'bold' },
    main: { flexDirection: 'row', gap: theme.spacing.l, padding: theme.spacing.l, flexGrow: 1 },
    avatar: { width: 48, height: 48, borderRadius: theme.shape.full, backgroundColor: theme.colors.surfaceContainerHigh },
    textInput: { color: theme.colors.onSurface, fontSize: 20, textAlignVertical: 'top', minHeight: 100 },
    mediaGrid: { marginTop: theme.spacing.l, gap: theme.spacing.s, flexDirection: 'row', flexWrap: 'wrap' },
    mediaItem: { position: 'relative' },
    mediaPreview: { width: '100%', aspectRatio: 1, borderRadius: theme.shape.medium, resizeMode: 'cover' },
    removeMediaButton: { position: 'absolute', top: theme.spacing.s, right: theme.spacing.s, backgroundColor: 'rgba(0,0,0,0.6)', padding: theme.spacing.xs, borderRadius: theme.shape.full },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.s, borderTopWidth: 1, borderTopColor: theme.colors.surfaceContainerHigh },
    iconButton: { padding: theme.spacing.s },
    langButton: { paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.xs, borderRadius: theme.shape.full },
    langButtonText: { color: theme.colors.primary, ...theme.typography.labelMedium, fontWeight: '500' },
    divider: { width: 1, height: 20, backgroundColor: theme.colors.surfaceContainerHigh },
    langModalBackdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    langModalContent: { width: '100%', maxHeight: '50%', backgroundColor: theme.colors.surfaceContainerHigh, borderTopLeftRadius: theme.shape.large, borderTopRightRadius: theme.shape.large, overflow: 'hidden' },
    langSearchInput: { width: '100%', padding: theme.spacing.m, backgroundColor: theme.colors.surfaceContainer, borderBottomWidth: 1, borderBottomColor: theme.colors.outline, color: theme.colors.onSurface },
    langOption: { width: '100%', padding: theme.spacing.m },
    langOptionSelected: { backgroundColor: theme.colors.primary },
    langOptionText: { color: theme.colors.onSurface },
    langOptionTextSelected: { color: theme.colors.onPrimary }
});

export default Composer;