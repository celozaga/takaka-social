import React, { useState } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { X, AtSign } from 'lucide-react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { PrimaryButton, SecondaryButton } from '@/components/shared';
import { useTranslation } from 'react-i18next';

interface UpdateHandleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateHandleModal: React.FC<UpdateHandleModalProps> = ({ onClose, onSuccess }) => {
    const { agent, logout } = useAtp();
    const { toast } = useToast();
    const { requireAuth } = useAuthGuard();
    const router = useRouter();
    const [handle, setHandle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    // Verificar autenticação ao montar o componente
    React.useEffect(() => {
        if (!requireAuth('edit_profile')) {
            onClose();
        }
    }, [requireAuth, onClose]);

    const handleSave = async () => {
        if (!handle.trim()) {
            setError("Handle cannot be empty.");
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            await agent.com.atproto.identity.updateHandle({ handle: handle.replace('@', '') });
            toast({ title: "Handle updated!", description: "You have been logged out. Please sign in again with your new handle." });
            await logout();
            onSuccess();
            router.replace('/(tabs)/home');
        } catch (err: any) {
            setError(err.message || 'An error occurred. The handle might be taken.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Update Handle</Text>
                <Pressable onPress={onClose} style={styles.closeButton}><X color={theme.colors.onSurface} /></Pressable>
            </View>
            <View style={styles.content}>
                 <Text style={styles.description}>Enter your new handle. This will log you out and you will need to sign in again.</Text>
                 <View style={styles.inputContainer}>
                    <AtSign style={styles.inputIcon} color={theme.colors.onSurfaceVariant} size={20} />
                    <TextInput
                        value={handle}
                        onChangeText={setHandle}
                        placeholder="new-handle.bsky.social"
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        style={styles.input}
                        autoCapitalize="none"
                    />
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
                <View style={styles.modalActions}>
                    <SecondaryButton
                        title={t('common.cancel')}
                        onPress={onClose}
                        style={styles.modalButton}
                    />
                    <PrimaryButton
                        title={t('common.save')}
                        onPress={handleSave}
                        disabled={!handle.trim() || isSaving}
                        loading={isSaving}
                        style={styles.modalButton}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.shape.large,
        padding: theme.spacing.xl,
        gap: theme.spacing.l,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        ...theme.typography.titleLarge,
        color: theme.colors.onSurface,
    },
    closeButton: {
        padding: theme.spacing.s,
        margin: -theme.spacing.s,
    },
    content: {
        gap: theme.spacing.l,
    },
    description: {
        ...theme.typography.bodyMedium,
        color: theme.colors.onSurfaceVariant,
    },
    inputContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: theme.spacing.m,
    },
    input: {
        width: '100%',
        paddingLeft: 40,
        paddingRight: theme.spacing.m,
        paddingVertical: 10,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.shape.medium,
        color: theme.colors.onSurface,
    },
    errorText: {
        color: theme.colors.error,
        ...theme.typography.bodyMedium,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: theme.spacing.l,
    },
    modalButton: {
        flex: 1,
        marginHorizontal: theme.spacing.s,
    },
});

export default UpdateHandleModal;
