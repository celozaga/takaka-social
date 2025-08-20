import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useModeration } from '../../context/ModerationContext';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { AppBskyActorDefs } from '@atproto/api';
import { ArrowLeft, Loader2, BadgeCheck } from 'lucide-react';

interface ModerationServiceScreenProps {
  serviceDid: string;
}

const BLUESKY_OFFICIAL_MOD_SERVICE = 'did:plc:z72i7hdynmk6r22z27h6tvur';

const blueskyLabelDefs = {
  'porn': {
    id: 'porn',
    title: 'Adult Content',
    description: 'Explicit sexual images.',
    adult: true,
  },
  'sexual': {
    id: 'sexual',
    title: 'Sexually Suggestive',
    description: 'Does not include nudity.',
    adult: true,
  },
  'nudity': {
    id: 'nudity',
    title: 'Non-sexual Nudity',
    description: 'e.g. artistic nudes.',
    adult: true,
  },
  'graphic-media': {
    id: 'graphic-media',
    title: 'Graphic Media',
    description: 'Explicit or potentially disturbing media.',
    adult: false,
  }
};
type LabelId = keyof typeof blueskyLabelDefs;
const configurableLabels = ['porn', 'sexual', 'nudity', 'graphic-media'] as LabelId[];

type LabelVisibility = 'show' | 'warn' | 'hide';


const ModerationServiceScreen: React.FC<ModerationServiceScreenProps> = ({ serviceDid }) => {
    const { getProfile } = useProfileCache();
    const { isReady, adultContentEnabled, labelPreferences, setLabelPreference } = useModeration();
    const [serviceProfile, setServiceProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const data = await getProfile(serviceDid);
                setServiceProfile(data);
            } catch (e) {
                console.error("Failed to fetch mod service profile", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [getProfile, serviceDid]);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    if (!serviceProfile) {
        return <div className="text-center p-8 bg-surface-2 rounded-lg text-error">Could not load moderation service details.</div>;
    }

    return (
        <div>
            <div className="sticky top-0 bg-surface-1/80 backdrop-blur-sm z-30 -mx-4 px-4">
                <div className="flex items-center justify-between h-16">
                    <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-surface-3">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="font-bold text-center truncate">{serviceProfile.displayName}</h1>
                    <div className="w-8"></div>
                </div>
            </div>
            
             <div className="p-4">
                <div className="flex items-center gap-4">
                    <img src={serviceProfile.avatar} alt="Avatar" className="w-16 h-16 rounded-full bg-surface-3" />
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span>{serviceProfile.displayName}</span>
                            {serviceProfile.labels?.some(l => l.val === 'blue-check') && <BadgeCheck className="w-5 h-5 text-primary" fill="currentColor" />}
                        </h2>
                        <p className="text-on-surface-variant text-sm">@{serviceProfile.handle}</p>
                    </div>
                </div>
                {serviceProfile.description && <p className="mt-4 text-on-surface text-sm">{serviceProfile.description}</p>}
            </div>

            <div className="mt-4 space-y-4">
                 {configurableLabels.map(labelId => {
                    const def = blueskyLabelDefs[labelId];
                    const isDisabled = !isReady || (def.adult && !adultContentEnabled);
                    const currentVisibility = labelPreferences.get(def.id) || (def.adult ? 'warn' : 'show');
                     
                    return (
                        <div key={def.id} className={`bg-surface-2 rounded-lg p-4 transition-opacity ${isDisabled ? 'opacity-50' : ''}`}>
                            <h3 className="font-semibold">{def.title}</h3>
                            <p className="text-sm text-on-surface-variant">{def.description}</p>
                            {isDisabled && <p className="text-xs text-amber-400 mt-1">Configured in moderation settings.</p>}

                            <div className={`mt-3 grid grid-cols-3 gap-2 ${isDisabled ? 'pointer-events-none' : ''}`}>
                                 {(['Hide', 'Warn', 'Show'] as const).map(option => {
                                    const value = option.toLowerCase() as LabelVisibility;
                                    const isActive = currentVisibility === value;
                                    return (
                                        <button 
                                            key={option}
                                            onClick={() => setLabelPreference(def.id, value)}
                                            className={`py-2 px-3 text-sm font-semibold rounded-md transition-colors ${
                                                isActive ? 'bg-primary text-on-primary' : 'bg-surface-3 hover:bg-surface-3/80'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    );
                                 })}
                            </div>
                        </div>
                    );
                 })}
            </div>
        </div>
    );
};

export default ModerationServiceScreen;
