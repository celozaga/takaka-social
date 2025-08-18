import React from 'react';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { useToast } from '../ui/use-toast';
import ScreenHeader from '../layout/ScreenHeader';
import { Mail, Edit, Lock, AtSign, Cake, Download, Power, Trash2, ChevronRight, ShieldCheck } from 'lucide-react';

interface SettingsListItemProps {
    icon: React.ElementType;
    label: string;
    value?: React.ReactNode;
    href?: string;
    onClick?: () => void;
    isDestructive?: boolean;
}

const SettingsListItem: React.FC<SettingsListItemProps> = ({ icon: Icon, label, value, href, onClick, isDestructive = false }) => {
    const content = (
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
                <Icon className={`w-6 h-6 ${isDestructive ? 'text-error' : 'text-on-surface-variant'}`} />
                <span className={`font-semibold ${isDestructive ? 'text-error' : 'text-on-surface'}`}>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-on-surface-variant text-sm truncate">{value}</span>}
                {(href || onClick) && <ChevronRight className="w-5 h-5 text-on-surface-variant" />}
            </div>
        </div>
    );

    const baseClasses = "transition-colors block w-full text-left";
    const hoverClasses = href || onClick ? "hover:bg-surface-3" : "";

    if (href) {
        return <a href={href} target="_blank" rel="noopener noreferrer" className={`${baseClasses} ${hoverClasses}`}>{content}</a>;
    }
    if (onClick) {
        return <button onClick={onClick} className={`${baseClasses} ${hoverClasses}`}>{content}</button>;
    }
    return <div className={baseClasses}>{content}</div>;
};

const AccountSettingsScreen: React.FC = () => {
    const { session, agent, logout } = useAtp();
    const { setCustomFeedHeaderVisible, openUpdateEmailModal, openUpdateHandleModal } = useUI();
    const { toast } = useToast();

    React.useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    const handleExportData = async () => {
        toast({ title: "Requesting Data Export...", description: "This may take a few moments." });
        try {
            await (agent.com.atproto.server as any).requestAccountExport();
            toast({ title: "Export Started", description: "Your data export is being prepared. You will receive an email when it is ready to download." });
        } catch (e) {
            console.error("Failed to request data export", e);
            toast({ title: "Error", description: "Could not start data export. Please try again later.", variant: "destructive" });
        }
    };

    const handleDeactivate = async () => {
        if (window.confirm("Are you sure you want to deactivate your account? Your profile and posts will not be visible, but your data will be preserved. You can reactivate your account by logging in again.")) {
            try {
                await agent.com.atproto.server.deactivateAccount({});
                toast({ title: "Account Deactivated", description: "You have been logged out." });
                await logout();
                window.location.hash = '#/';
            } catch (e) {
                console.error("Failed to deactivate account", e);
                toast({ title: "Error", description: "Could not deactivate your account. Please try again.", variant: "destructive" });
            }
        }
    };
    
    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to request account deletion? This is permanent and cannot be undone. An email will be sent to you to confirm.")) {
            toast({ title: "Requesting Account Deletion..." });
            try {
                await agent.com.atproto.server.requestAccountDelete();
                toast({ title: "Deletion Requested", description: "Please check your email to confirm account deletion." });
            } catch (e) {
                console.error("Failed to request account deletion", e);
                toast({ title: "Error", description: "Could not request account deletion. Please try again later.", variant: "destructive" });
            }
        }
    };
    
    const emailValue = (
        <div className="flex items-center gap-1.5">
            <span>{session?.email}</span>
            {session?.emailConfirmed && <ShieldCheck className="w-4 h-4 text-primary" />}
        </div>
    );

    return (
        <div>
            <ScreenHeader title="Account" />
            <div className="mt-4 space-y-6">
                <div className="bg-surface-2 rounded-lg overflow-hidden">
                    <SettingsListItem icon={Mail} label="Email" value={emailValue} />
                    <SettingsListItem icon={Edit} label="Update email" onClick={openUpdateEmailModal} />
                    <SettingsListItem icon={Lock} label="Password" href="https://bsky.app/settings/password" />
                    <SettingsListItem icon={AtSign} label="Handle" value={`@${session?.handle}`} onClick={openUpdateHandleModal} />
                    <SettingsListItem icon={Cake} label="Birthday" href="https://bsky.app/settings/birthday" />
                </div>

                <div className="bg-surface-2 rounded-lg overflow-hidden">
                    <SettingsListItem icon={Download} label="Export my data" onClick={handleExportData} />
                    <SettingsListItem icon={Power} label="Deactivate account" onClick={handleDeactivate} isDestructive />
                    <SettingsListItem icon={Trash2} label="Delete account" onClick={handleDeleteAccount} isDestructive />
                </div>
            </div>
        </div>
    );
};

export default AccountSettingsScreen;