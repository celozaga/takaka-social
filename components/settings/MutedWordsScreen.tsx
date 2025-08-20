import React, { useState } from 'react';
import { useModeration } from '../../context/ModerationContext';
import ScreenHeader from '../layout/ScreenHeader';
import { Trash2, Tag, Plus } from 'lucide-react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

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
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.description}>
                    Posts containing these words or tags will be hidden from your feeds. Muting is case-insensitive.
                </Text>
                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Tag style={styles.inputIcon} color="#C3C6CF" size={20}/>
                        <TextInput
                            value={newWord}
                            onChangeText={setNewWord}
                            placeholder="Add a word or #tag"
                            placeholderTextColor="#8A9199"
                            style={styles.input}
                            onSubmitEditing={handleAdd}
                        />
                    </View>
                    <Pressable onPress={handleAdd} disabled={isAdding || !newWord.trim()} style={[styles.addButton, (isAdding || !newWord.trim()) && styles.disabledButton]}>
                        {isAdding ? <ActivityIndicator color="#003258" /> : <Plus color="#003258" />}
                        <Text style={styles.addButtonText}>Add</Text>
                    </Pressable>
                </View>

                <View style={styles.listContainer}>
                    {!isReady ? (
                        <View style={styles.centered}><ActivityIndicator size="large" /></View>
                    ) : mutedWords.length === 0 ? (
                        <View style={styles.centered}><Text style={styles.infoText}>You haven't muted any words yet.</Text></View>
                    ) : (
                        mutedWords.map((word, index) => (
                            <View key={word.value} style={[styles.listItem, index > 0 && styles.listItemBorder]}>
                                <Text style={styles.wordText}>{word.value}</Text>
                                <Pressable onPress={() => handleRemove(word.value)} style={styles.removeButton}>
                                    <Trash2 size={18} color="#C3C6CF" />
                                </Pressable>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16 },
    description: { color: '#C3C6CF', fontSize: 14, marginBottom: 16 },
    formContainer: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    inputContainer: { position: 'relative', flex: 1, justifyContent: 'center' },
    inputIcon: { position: 'absolute', left: 12 },
    input: { width: '100%', paddingLeft: 40, paddingRight: 12, paddingVertical: 10, backgroundColor: '#1E2021', borderRadius: 8, color: '#E2E2E6' },
    addButton: { backgroundColor: '#A8C7FA', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderRadius: 8 },
    disabledButton: { opacity: 0.5 },
    addButtonText: { color: '#003258', fontWeight: 'bold' },
    listContainer: { backgroundColor: '#1E2021', borderRadius: 12, overflow: 'hidden' },
    centered: { padding: 32, alignItems: 'center' },
    infoText: { color: '#C3C6CF' },
    listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
    listItemBorder: { borderTopWidth: 1, borderTopColor: '#2b2d2e' },
    wordText: { fontWeight: '600', color: '#E2E2E6' },
    removeButton: { padding: 8, borderRadius: 999 },
});

export default MutedWordsScreen;
