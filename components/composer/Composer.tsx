
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { RichText, AppBskyActorDefs } from '@atproto/api';
import { ImageUp, Send, X, Video } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { View, Text, TextInput, Pressable, Image, StyleSheet, ActivityIndicator, ScrollView, Modal, Platform } from 'react-native';

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
    // For native, this would be a URI from a library like expo-image-picker
    // For web, we keep the File object for upload and a blob URI for preview
    file?: File; 
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

const CharacterCount: React.FC<{ remainingChars: number }> = ({ remainingChars }) => {
    const color = remainingChars < 0 ? '#F2B8B5' : (remainingChars < 20 ? '#A8C7FA' : '#C3C6CF');
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
  
  // Note: Direct file input manipulation is not possible in React Native.
  // This would be replaced by a library like expo-image-picker.
  // The UI is provided, but the file selection logic is web-only for now.
  const fileInputRef = Platform.OS === 'web' ? useRef<HTMLInputElement>(null) : null;

  useEffect(() => {
    if (session?.did) {
      agent.getProfile({ actor: session.did }).then(({ data }) => {
        setProfile(data);
      }).catch(err => {
        console.error("Failed to fetch user profile:", err);
      });
    }
  }, [agent, session?.did]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mediaFiles.length + files.length > MAX_IMAGES && !Array.from(files).some(f => f.type.startsWith('video'))) {
        toast({ title: t('composer.toast.maxImages', { max: MAX_IMAGES }), variant: 'destructive' });
        return;
    }
    // ... rest of web-specific file validation
    const newMediaFiles: MediaFile[] = [...mediaFiles];
    Array.from(files).forEach(file => {
        const type = file.type.startsWith('video') ? 'video' : (file.type === 'image/gif' ? 'gif' : 'image');
        newMediaFiles.push({ file, preview: URL.createObjectURL(file), type });
    });
    setMediaFiles(newMediaFiles);
  };
  
  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    // web-specific cleanup
    if (Platform.OS === 'web' && fileInputRef?.current) {
        fileInputRef.current.value = "";
    }
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
    // ... The rest of the post logic remains largely the same
    // but would need native-specific blob handling if not on web.
    try {
        const rt = new RichText({ text });
        await rt.detectFacets(agent);

        let postRecord: any = {
            $type: 'app.bsky.feed.post',
            text: rt.text,
            facets: rt.facets,
            createdAt: new Date().toISOString(),
        };
        
        // ... embed logic ...
        // This part is highly platform-dependent for file uploads.
        // Assuming web for now.
        if (Platform.OS === 'web' && mediaFiles.length > 0 && mediaFiles[0].file) {
            const imageEmbeds = await Promise.all(mediaFiles.map(async mf => {
                const fileBytes = new Uint8Array(await mf.file!.arrayBuffer());
                const blobRes = await agent.uploadBlob(fileBytes, { encoding: mf.file!.type });
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
                {isPosting ? <ActivityIndicator color="#001D35" /> : <Send color="#001D35" size={16} />}
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
                    placeholderTextColor="#8A9199"
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Pressable 
                    onPress={() => Platform.OS === 'web' && fileInputRef?.current?.click()} 
                    style={styles.iconButton}
                    disabled={mediaFiles.length >= MAX_IMAGES || hasVideoOrGif}
                >
                    <ImageUp color="#A8C7FA" size={24} />
                </Pressable>
                <Pressable 
                    onPress={() => Platform.OS === 'web' && fileInputRef?.current?.click()} 
                    style={styles.iconButton}
                    disabled={mediaFiles.length > 0}
                >
                    <Video color="#A8C7FA" size={24} />
                </Pressable>
                 {Platform.OS === 'web' && (
                    <input 
                        type="file" 
                        ref={fileInputRef as any}
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/gif, video/mp4, video/quicktime" 
                        style={{ display: 'none' }}
                        multiple={!hasVideoOrGif}
                    />
                 )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
    container: { flex: 1, backgroundColor: '#1E2021' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, flexShrink: 0 },
    cancelButton: { paddingHorizontal: 16, paddingVertical: 8 },
    cancelButtonText: { color: '#A8C7FA', fontWeight: '500' },
    postButton: { backgroundColor: '#A8C7FA', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 20, borderRadius: 999 },
    postButtonDisabled: { opacity: 0.5 },
    postButtonText: { color: '#003258', fontWeight: 'bold' },
    main: { flexDirection: 'row', gap: 16, padding: 16, flexGrow: 1 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2b2d2e' },
    textInput: { color: '#E2E2E6', fontSize: 20, textAlignVertical: 'top', minHeight: 100 },
    mediaGrid: { marginTop: 16, gap: 8, flexDirection: 'row', flexWrap: 'wrap' },
    mediaItem: { position: 'relative' },
    mediaPreview: { width: '100%', aspectRatio: 1, borderRadius: 8, resizeMode: 'cover' },
    removeMediaButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 999 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderTopWidth: 1, borderTopColor: '#2b2d2e' },
    iconButton: { padding: 8 },
    langButton: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
    langButtonText: { color: '#A8C7FA', fontSize: 14, fontWeight: '500' },
    divider: { width: 1, height: 20, backgroundColor: '#2b2d2e' },
    langModalBackdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    langModalContent: { width: '100%', maxHeight: '50%', backgroundColor: '#2b2d2e', borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden' },
    langSearchInput: { width: '100%', padding: 12, backgroundColor: '#1E2021', borderBottomWidth: 1, borderBottomColor: '#2b2d2e', color: '#E2E2E6' },
    langOption: { width: '100%', padding: 12 },
    langOptionSelected: { backgroundColor: '#D1E4FF' },
    langOptionText: { color: '#E2E2E6' },
    langOptionTextSelected: { color: '#001D35' }
});

export default Composer;
