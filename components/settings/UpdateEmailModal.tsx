import React, { useState } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { X, Mail } from 'lucide-react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '@/lib/theme';
import { useAuthGuard } from '@/hooks/useAuthGuard';

interface UpdateEmailModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateEmailModal: React.FC<UpdateEmailModalProps> = ({ onClose, onSuccess }) => {
    const { agent } = useAtp();
    const { toast } = useToast();
    const { requireAuth } = useAuthGuard();
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Verificar autenticação ao montar o componente
    React.useEffect(() => {
        if (!requireAuth('edit_profile')) {
            onClose();
        }
    }, [requireAuth, onClose]);

    const handleSave = async () => {
        if (!email.trim()) {
            setError("Email cannot be empty.");
            return;
        }
        setIsSaving(true);
        setError('');
        setSuccess(false);
        try {
            await agent.com.atproto.server.updateEmail({ email });
            toast({ title: "Email updated successfully!" });
            onSuccess();
        } catch (err: any) {
            if (err.name === 'XRPCError' && err.error === 'TokenRequired') {
                setSuccess(true);
            } else {
                setError(err.message || 'An error occurred.');
            }
        } finally {
            setIsSaving(false);
        }
    };
    
    if (success) {
        return (
             <View style={styles.container}>
                 <Text style={styles.headerTitle}>Check your email</Text>
                 <Text style={styles.description}>A confirmation link has been sent to <Text style={{fontWeight: 'bold'}}>{email}</Text>. Please click the link to confirm your new email address.</Text>
                 <Pressable onPress={onClose} style={styles.button}>
                     <Text style={styles.buttonText}>Close</Text>
                 </Pressable>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Update Email</Text>
                <Pressable onPress={onClose} style={styles.closeButton}><X color={theme.colors.onSurface}/></Pressable>
            </View>
            <View style={styles.content}>
                 <Text style={styles.description}>Enter your new email address. A verification link will be sent to it.</Text>
                 <View style={styles.inputContainer}>
                    <Mail style={styles.inputIcon} color={theme.colors.onSurfaceVariant} size={20} />
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="new-email@example.com"
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
                <Pressable
                    onPress={handleSave}
                    disabled={isSaving || !email.trim()}
                    style={[styles.button, (isSaving || !email.trim()) && styles.buttonDisabled]}
                >
                    {isSaving ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={styles.buttonText}>Send Verification Email</Text>}
                </Pressable>
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
    button: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        paddingVertical: 10,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.shape.full,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: theme.colors.onPrimary,
        fontWeight: 'bold',
    },
});

export default UpdateEmailModal;
