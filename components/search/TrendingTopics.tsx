
import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { TrendingUp } from 'lucide-react';

const TrendingTopics: React.FC = () => {
    const { agent } = useAtp();
    const [trends, setTrends] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrends = async () => {
            setIsLoading(true);
            try {
                // The `getTrendingHashtags` method is on the unspecced API namespace.
                const { data } = await (agent.api.app.bsky.unspecced as any).getTrendingHashtags({ limit: 10 });
                if (data.hashtags) {
                    setTrends(data.hashtags.map(h => h.tag));
                }
            } catch (error) {
                console.error("Failed to fetch trending topics:", error);
                // Silently fail, don't show an error to the user
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrends();
    }, [agent]);

    if (isLoading) {
        return (
            <div>
                <h2 className="text-xl font-bold mb-3 px-1 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <span>Trending</span>
                </h2>
                <div className="bg-surface-2 rounded-xl p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-5 w-3/4 bg-surface-3 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }
    
    if (trends.length === 0) {
        return null; // Don't render if there are no trends or if the fetch failed
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-3 px-1 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                <span>Trending</span>
            </h2>
            <div className="bg-surface-2 rounded-xl">
                <ul className="divide-y divide-surface-3">
                    {trends.map(tag => (
                        <li key={tag}>
                            <a 
                                href={`#/search?q=${encodeURIComponent('#' + tag)}&filter=top`} 
                                className="block p-3 hover:bg-surface-3 transition-colors rounded-lg"
                            >
                                <p className="font-semibold text-on-surface">#{tag}</p>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TrendingTopics;
