import React, { useState } from 'react';
import { useModeration } from '../../context/ModerationContext';
import ScreenHeader from '../layout/ScreenHeader';
import { Trash2, Tag, Plus } from 'lucide-react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { theme } from '@/lib/theme';
import SettingsDivider from '../ui/SettingsDivider';

const MutedWordsScreen: React.FC = () => {
    const { isReady, mutedWords, addMutedWord, removeMutedWord } = useModeration();
    const [newWord, setNewWord] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    const handleAdd = async () => {
        if (!newWord.trim() || isAdding) return;
        setIsAdding(true);
        try {
            await addMutedWord(newWord.trim());
            setNewWord('');
        } catch (error) { console.error("Failed to add muted word:", error); }
        finally { setIsAdding(false); }
    };

    const handleRemove = async (word: string) => {
        try { await removeMutedWord(word); }
        catch (error) { console.error("Failed to remove muted word:", error); }
    }

    return (
        <View style={{ flex: 1 }}>
            <ScreenHeader title="Muted Words & Tags" />
            <ScrollView contentContainerStyle={theme.settingsStyles.scrollContainer}>
                <Text style={theme.settingsStyles.description}>
                    Posts containing these words or tags will be hidden from your feeds. Muting is case-insensitive.
                </Text>
                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Tag style={styles.inputIcon} color={theme.colors.onSurfaceVariant} size={20}/>
                        <TextInput
                            value={newWord}
                            onChangeText={setNewWord}
                            placeholder="Add a word or #tag"
                            placeholderTextColor={theme.colors.onSurfaceVariant}
                            style={styles.input}
                            onSubmitEditing={handleAdd}
                        />
                    </View>
                    <Pressable onPress={handleAdd} disabled={isAdding || !newWord.trim()} style={[styles.addButton, (isAdding || !newWord.trim()) && styles.disabledButton]}>
                        {isAdding ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Plus color={theme.colors.onPrimary} />}
                        <Text style={styles.addButtonText}>Add</Text>
                    </Pressable>
                </View>

                <View style={[theme.settingsStyles.section, {marginTop: theme.spacing.xl}]}>
                    {!isReady ? (
                        <View style={styles.centered}><ActivityIndicator size="large" /></View>
                    ) : mutedWords.length === 0 ? (
                        <View style={styles.centered}><Text style={styles.infoText}>You haven't muted any words yet.</Text></View>
                    ) : (
                        mutedWords.map((word, index) => (
                            <React.Fragment key={word.value}>
                                <View style={theme.settingsStyles.item}>
                                    <Text style={theme.settingsStyles.label}>{word.value}</Text>
                                    <Pressable onPress={() => handleRemove(word.value)} style={styles.removeButton}>
                                        <Trash2 size={18} color={theme.colors.onSurfaceVariant} />
                                    </Pressable>
                                </View>
                                {index < mutedWords.length - 1 && <SettingsDivider />}
                            </React.Fragment>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    formContainer: { flexDirection: 'row', gap: theme.spacing.s },
    inputContainer: { position: 'relative', flex: 1, justifyContent: 'center' },
    inputIcon: { position: 'absolute', left: theme.spacing.m },
    input: { width: '100%', paddingLeft: 40, paddingRight: theme.spacing.m, paddingVertical: 10, backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.shape.medium, color: theme.colors.onSurface },
    addButton: { backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, paddingHorizontal: theme.spacing.l, borderRadius: theme.shape.medium },
    disabledButton: { opacity: 0.5 },
    addButtonText: { color: theme.colors.onPrimary, fontWeight: 'bold' },
    centered: { padding: theme.spacing.xxl, alignItems: 'center' },
    infoText: { color: theme.colors.onSurfaceVariant },
    removeButton: { padding: theme.spacing.s, borderRadius: theme.shape.full },
});

export default MutedWordsScreen;
