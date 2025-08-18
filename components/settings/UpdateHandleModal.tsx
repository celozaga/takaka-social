
import React, { useState } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { X, Loader2, AtSign } from 'lucide-react';

interface UpdateHandleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateHandleModal: React.FC<UpdateHandleModalProps> = ({ onClose, onSuccess }) => {
    const { agent, logout } = useAtp();
    const { toast } = useToast();
    const [handle, setHandle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            await agent.com.atproto.identity.updateHandle({ handle: handle.replace('@', '') });
            toast({ title: "Handle updated!", description: "You have been logged out. Please sign in again with your new handle." });
            await logout();
            onSuccess();
            window.location.hash = '#/'; // Go to home after logout
        } catch (err: any) {
            console.error("Failed to update handle", err);
            setError(err.message || 'An error occurred. The handle might be taken.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-surface-2 rounded-xl">
            <div className="p-4 flex items-center justify-between border-b border-surface-3">
                <h2 className="text-xl font-bold">Update Handle</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-3"><X /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
                 <p className="text-sm text-on-surface-variant">Enter your new handle. This will log you out and you will need to sign in again.</p>
                 <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                    <input
                        type="text"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        placeholder="new-handle.bsky.social"
                        className="w-full pl-10 pr-4 py-2 bg-surface-3 rounded-lg focus:ring-1 focus:ring-primary outline-none transition"
                        required
                    />
                </div>
                {error && <p className="text-error text-sm text-center">{error}</p>}
                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-primary text-on-primary font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Handle'}
                </button>
            </form>
        </div>
    );
};

export default UpdateHandleModal;
