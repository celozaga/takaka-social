
import React, { useState } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { X, AtSign } from 'lucide-react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

interface UpdateHandleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateHandleModal: React.FC<UpdateHandleModalProps> = ({ onClose, onSuccess }) => {
    const { agent, logout } = useAtp();
    const { toast } = useToast();
    const router = useRouter();
    const [handle, setHandle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

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
                <Pressable onPress={onClose} style={styles.closeButton}><X color="#E2E2E6" /></Pressable>
            </View>
            <View style={styles.content}>
                 <Text style={styles.description}>Enter your new handle. This will log you out and you will need to sign in again.</Text>
                 <View style={styles.inputContainer}>
                    <AtSign style={styles.inputIcon} color="#C3C6CF" size={20} />
                    <TextInput
                        value={handle}
                        onChangeText={setHandle}
                        placeholder="new-handle.bsky.social"
                        placeholderTextColor="#8A9199"
                        style={styles.input}
                        autoCapitalize="none"
                    />
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
                <Pressable
                    onPress={handleSave}
                    disabled={isSaving || !handle.trim()}
                    style={[styles.button, (isSaving || !handle.trim()) && styles.buttonDisabled]}
                >
                    {isSaving ? <ActivityIndicator color="#003258" /> : <Text style={styles.buttonText}>Update Handle</Text>}
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1E2021',
        borderRadius: 12,
        padding: 24,
        gap: 16,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E2E2E6',
    },
    closeButton: {
        padding: 8,
        margin: -8,
    },
    content: {
        gap: 16,
    },
    description: {
        fontSize: 14,
        color: '#C3C6CF',
    },
    inputContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: 12,
    },
    input: {
        width: '100%',
        paddingLeft: 40,
        paddingRight: 12,
        paddingVertical: 10,
        backgroundColor: '#2b2d2e',
        borderRadius: 8,
        color: '#E2E2E6',
    },
    errorText: {
        color: '#F2B8B5',
        fontSize: 14,
        textAlign: 'center',
    },
    button: {
        width: '100%',
        backgroundColor: '#A8C7FA',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 999,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#003258',
        fontWeight: 'bold',
    },
});

export default UpdateHandleModal;