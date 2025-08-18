import React, { useState } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { X, Loader2, Mail } from 'lucide-react';

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess(false);
        try {
            await agent.com.atproto.server.updateEmail({ email });
            // If the call succeeds without throwing, the email was updated without needing verification.
            toast({ title: "Email updated successfully!" });
            onSuccess();
        } catch (err: any) {
            // If verification is required, the server throws a 'TokenRequired' error.
            if (err.name === 'XRPCError' && err.error === 'TokenRequired') {
                setSuccess(true);
            } else {
                console.error("Failed to update email", err);
                setError(err.message || 'An error occurred.');
            }
        } finally {
            setIsSaving(false);
        }
    };
    
    if (success) {
        return (
             <div className="bg-surface-2 p-8 rounded-xl text-center">
                 <h2 className="text-xl font-bold mb-4">Check your email</h2>
                 <p className="text-on-surface-variant">A confirmation link has been sent to <strong>{email}</strong>. Please click the link to confirm your new email address.</p>
                 <button onClick={onClose} className="mt-6 w-full bg-primary text-on-primary font-bold py-2 px-4 rounded-full">Close</button>
            </div>
        )
    }

    return (
        <div className="bg-surface-2 rounded-xl">
            <div className="p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Update Email</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-3"><X /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
                 <p className="text-sm text-on-surface-variant">Enter your new email address. A verification link will be sent to it.</p>
                 <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="new-email@example.com"
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
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification Email'}
                </button>
            </form>
        </div>
    );
};

export default UpdateEmailModal;