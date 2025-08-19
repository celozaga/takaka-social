import React from 'react';
import { useModeration } from '../../context/ModerationContext';
import ScreenHeader from '../layout/ScreenHeader';
import { ChevronRight, Shield, Filter, Users, MessageSquare, Tag, UserX, Loader2 } from 'lucide-react';
import ToggleSwitch from '../ui/ToggleSwitch';

const SettingsItem: React.FC<{
    icon: React.FC<any>;
    title: string;
    subtitle?: string;
    href: string;
    disabled?: boolean;
}> = ({ icon: Icon, title, subtitle, href, disabled }) => {
    const content = (
        <div className={`flex items-center justify-between p-4 ${disabled ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-4">
                <Icon className="w-6 h-6 text-on-surface-variant" />
                <div>
                    <span className="font-semibold">{title}</span>
                    {subtitle && <p className="text-sm text-on-surface-variant">{subtitle}</p>}
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-on-surface-variant" />
        </div>
    );
    
    if (disabled) {
        return <div className="cursor-not-allowed">{content}</div>;
    }
    
    return <a href={href} className="block hover:bg-surface-3 transition-colors">{content}</a>;
};

const BLUESKY_OFFICIAL_MOD_SERVICE = 'did:plc:z72i7hdynmk6r22z27h6tvur';

const ModerationSettingsScreen: React.FC = () => {
    const { isReady, adultContentEnabled, setAdultContentEnabled } = useModeration();

    return (
        <div>
            <ScreenHeader title="Moderation" />
            <div className="mt-4 space-y-6">
                <div className="bg-surface-2 rounded-lg overflow-hidden">
                    <SettingsItem icon={Filter} title="Muted words & tags" href="#" disabled />
                    <SettingsItem icon={Users} title="Moderation lists" href="#" disabled />
                    <SettingsItem icon={MessageSquare} title="Muted accounts" href="#" disabled />
                    <SettingsItem icon={UserX} title="Blocked accounts" href="#" disabled />
                </div>
                
                <div>
                    <h3 className="font-bold text-on-surface-variant px-4 mb-2">Content filters</h3>
                    <div className="bg-surface-2 rounded-lg p-4 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div>
                                <span className="font-semibold">Enable adult content</span>
                            </div>
                        </div>
                        {isReady ? (
                             <ToggleSwitch checked={adultContentEnabled} onChange={setAdultContentEnabled} />
                        ) : (
                            <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant" />
                        )}
                    </div>
                </div>

                 <div>
                    <h3 className="font-bold text-on-surface-variant px-4 mb-2">Advanced</h3>
                    <div className="bg-surface-2 rounded-lg overflow-hidden">
                        <a href={`#/settings/mod-service/${BLUESKY_OFFICIAL_MOD_SERVICE}`} className="block hover:bg-surface-3 transition-colors">
                             <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4">
                                    <Shield className="w-6 h-6 text-primary" />
                                    <div>
                                        <span className="font-semibold">Bluesky Moderation Service</span>
                                        <p className="text-sm text-on-surface-variant">Official Bluesky moderation service.</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModerationSettingsScreen;
