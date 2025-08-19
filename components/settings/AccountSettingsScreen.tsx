
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { useToast } from '../ui/use-toast';
import ScreenHeader from '../layout/ScreenHeader';
import { Mail, Edit, Lock, AtSign, Cake, Download, Power, Trash2, ChevronRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useHeadManager } from '../../hooks/useHeadManager';

interface SettingsListItemProps {
    icon: React.ElementType;
    label: string;
    value?: React.ReactNode;
    href?: string;
    onClick?: () => void;
    isDestructive?: boolean;
    isLoading?: boolean;
    disabled?: boolean;
}

const SettingsListItem: React.FC<SettingsListItemProps> = ({ icon: Icon, label, value, href, onClick, isDestructive = false, isLoading = false, disabled = false }) => {
    const finalOnClick = disabled ? undefined : onClick;

    const content = (
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
                <Icon className={`w-6 h-6 ${isDestructive ? 'text-error' : 'text-on-surface-variant'}`} />
                <span className={`font-semibold ${isDestructive ? 'text-error' : 'text-on-surface'}`}>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-on-surface-variant text-sm truncate">{value}</span>}
                 {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant" />
                ) : (
                    (href || onClick) && <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                )}
            </div>
        </div>
    );

    const baseClasses = `transition-colors block w-full text-left ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
    const hoverClasses = href || onClick ? "hover:bg-surface-3" : "";

    if (href) {
        return <a href={href} target="_blank" rel="noopener noreferrer" className={`${baseClasses} ${hoverClasses}`}>{content}</a>;
    }
    if (onClick) {
        return <button onClick={finalOnClick} disabled={disabled} className={`${baseClasses} ${hoverClasses}`}>{content}</button>;
    }
    return <div className={baseClasses}>{content}</div>;
};

const AccountSettingsScreen: React.FC = () => {
    const { session, agent, logout } = useAtp();
    const { setCustomFeedHeaderVisible, openUpdateEmailModal, openUpdateHandleModal } = useUI();
    const { toast } = useToast();
    const { t } = useTranslation();
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    useHeadManager({ title: t('accountSettings.title') });

    React.useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    const handleExportData = async () => {
        if (actionInProgress) return;
        setActionInProgress('export');
        toast({ title: t('accountSettings.toast.exportRequest'), description: t('accountSettings.toast.exportRequestDescription') });
        try {
            await (agent.com.atproto.server as any).requestAccountExport();
            toast({ title: t('accountSettings.toast.exportStarted'), description: t('accountSettings.toast.exportStartedDescription') });
        } catch (e) {
            console.error("Failed to request data export", e);
            toast({ title: "Error", description: t('accountSettings.toast.exportError'), variant: "destructive" });
        } finally {
            setActionInProgress(null);
        }
    };

    const handleDeactivate = async () => {
        if (actionInProgress) return;
        if (window.confirm(t('accountSettings.confirmations.deactivate'))) {
            setActionInProgress('deactivate');
            try {
                await agent.com.atproto.server.deactivateAccount({});
                toast({ title: t('accountSettings.toast.deactivated'), description: t('accountSettings.toast.deactivatedDescription') });
                await logout();
                window.location.hash = '#/';
            } catch (e) {
                console.error("Failed to deactivate account", e);
                toast({ title: "Error", description: t('accountSettings.toast.deactivateError'), variant: "destructive" });
            } finally {
                 setActionInProgress(null);
            }
        }
    };
    
    const handleDeleteAccount = async () => {
        if (actionInProgress) return;
        if (window.confirm(t('accountSettings.confirmations.delete'))) {
            setActionInProgress('delete');
            toast({ title: t('accountSettings.toast.deleteRequest') });
            try {
                await agent.com.atproto.server.requestAccountDelete();
                toast({ title: t('accountSettings.toast.deleteRequested'), description: t('accountSettings.toast.deleteRequestedDescription') });
            } catch (e) {
                console.error("Failed to request account deletion", e);
                toast({ title: "Error", description: t('accountSettings.toast.deleteError'), variant: "destructive" });
            } finally {
                setActionInProgress(null);
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
                    <SettingsListItem icon={Edit} label="Update email" onClick={openUpdateEmailModal} disabled={!!actionInProgress} />
                    <SettingsListItem icon={Lock} label="Password" href="https://bsky.app/settings/password" />
                    <SettingsListItem icon={AtSign} label="Handle" value={`@${session?.handle}`} onClick={openUpdateHandleModal} disabled={!!actionInProgress} />
                    <SettingsListItem icon={Cake} label="Birthday" href="https://bsky.app/settings/birthday" />
                </div>

                <div className="bg-surface-2 rounded-lg overflow-hidden">
                    <SettingsListItem icon={Download} label="Export my data" onClick={handleExportData} isLoading={actionInProgress === 'export'} disabled={!!actionInProgress} />
                    <SettingsListItem icon={Power} label="Deactivate account" onClick={handleDeactivate} isDestructive isLoading={actionInProgress === 'deactivate'} disabled={!!actionInProgress} />
                    <SettingsListItem icon={Trash2} label="Delete account" onClick={handleDeleteAccount} isDestructive isLoading={actionInProgress === 'delete'} disabled={!!actionInProgress} />
                </div>
            </div>
        </div>
    );
};

export default AccountSettingsScreen;
