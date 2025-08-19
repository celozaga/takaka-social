
import React, { useState } from 'react';
import { useModeration } from '../../context/ModerationContext';
import ScreenHeader from '../layout/ScreenHeader';
import { Loader2, Trash2, Tag, Plus } from 'lucide-react';

const MutedWordsScreen: React.FC = () => {
    const { isReady, mutedWords, addMutedWord, removeMutedWord } = useModeration();
    const [newWord, setNewWord] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWord.trim() || isAdding) return;
        setIsAdding(true);
        try {
            await addMutedWord(newWord.trim());
            setNewWord('');
        } catch (error) {
            console.error("Failed to add muted word:", error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemove = async (word: string) => {
        // You may want to add a loading state per item for better UX
        try {
            await removeMutedWord(word);
        } catch (error) {
            console.error("Failed to remove muted word:", error);
        }
    }

    return (
        <div>
            <ScreenHeader title="Muted Words & Tags" />
            <div className="mt-4 p-4">
                <p className="text-on-surface-variant text-sm mb-4">
                    Posts containing these words or tags will be hidden from your feeds. Muting is case-insensitive.
                </p>
                <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                    <div className="relative flex-grow">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                        <input
                            type="text"
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            placeholder="Add a word or #tag"
                            className="w-full pl-10 pr-4 py-2 bg-surface-2 rounded-lg focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>
                    <button type="submit" disabled={isAdding || !newWord.trim()} className="bg-primary text-on-primary font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                        {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus />}
                        <span>Add</span>
                    </button>
                </form>

                <div className="bg-surface-2 rounded-lg">
                    {!isReady ? (
                        <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
                    ) : mutedWords.length === 0 ? (
                        <p className="p-8 text-center text-on-surface-variant">You haven't muted any words yet.</p>
                    ) : (
                        <ul className="divide-y divide-surface-3">
                            {mutedWords.map(word => (
                                <li key={word.value} className="flex items-center justify-between p-3">
                                    <span className="font-semibold">{word.value}</span>
                                    <button onClick={() => handleRemove(word.value)} className="p-2 rounded-full hover:bg-error/20 text-on-surface-variant hover:text-error">
                                        <Trash2 size={18} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MutedWordsScreen;
