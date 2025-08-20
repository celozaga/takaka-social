
import React, { useState } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { X, Loader2, Mail } from 'lucide-react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';

interface UpdateEmailModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateEmailModal: React.FC<UpdateEmailModalProps> = ({ onClose, onSuccess }) => {
    const { agent } = useAtp();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

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
                <Pressable onPress={onClose} style={styles.closeButton}><X color="#E2E2E6"/></Pressable>
            </View>
            <View style={styles.content}>
                 <Text style={styles.description}>Enter your new email address. A verification link will be sent to it.</Text>
                 <View style={styles.inputContainer}>
                    <Mail style={styles.inputIcon} color="#C3C6CF" size={20} />
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="new-email@example.com"
                        placeholderTextColor="#8A9199"
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
                    {isSaving ? <ActivityIndicator color="#003258" /> : <Text style={styles.buttonText}>Send Verification Email</Text>}
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

export default UpdateEmailModal;