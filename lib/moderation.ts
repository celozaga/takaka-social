import { AppBskyFeedDefs, ComAtprotoLabelDefs, AppBskyActorDefs } from '@atproto/api';

export type LabelVisibility = 'show' | 'warn' | 'hide';

export interface ModerationDecision {
  visibility: LabelVisibility;
  reason?: string;
  source?: 'post' | 'author';
}

interface ModerationPrefs {
    adultContentEnabled: boolean;
    labelPreferences: Map<string, LabelVisibility>;
    mutedWords: AppBskyActorDefs.MutedWord[];
}

// Define the labels that are considered "adult"
const ADULT_LABELS = new Set(['porn', 'sexual', 'nudity']);

export function moderatePost(post: AppBskyFeedDefs.PostView, prefs: ModerationPrefs): ModerationDecision {
    // 1. Check if author is muted
    if (post.author.viewer?.muted) {
        return { visibility: 'hide', reason: 'Muted user' };
    }

    // 2. Check for muted words in post text
    const record = post.record as { text?: string };
    if (record?.text && prefs.mutedWords.length > 0) {
        const textLower = record.text.toLowerCase();
        for (const muted of prefs.mutedWords) {
            if (textLower.includes(muted.value.toLowerCase())) {
                return { visibility: 'hide', reason: `Content contains muted word: "${muted.value}"` };
            }
        }
    }

    let finalDecision: ModerationDecision = { visibility: 'show' };

    const allLabels = [
        ...(post.labels || []).map(label => ({ label, source: 'post' as const })),
        ...(post.author.labels || []).map(label => ({ label, source: 'author' as const }))
    ];

    for (const { label, source } of allLabels) {
        const isAdult = ADULT_LABELS.has(label.val);

        // 3. Handle Adult Content global setting
        if (isAdult && !prefs.adultContentEnabled) {
            return { visibility: 'hide', reason: 'Adult Content', source };
        }

        // 4. Get user preference for this label
        const userVisibility = prefs.labelPreferences.get(label.val);

        if (userVisibility) {
            // Apply user preference, escalating from 'show' to 'warn' to 'hide'
            if (userVisibility === 'hide') {
                return { visibility: 'hide', reason: `Content labeled as "${label.val}"`, source };
            }
            if (userVisibility === 'warn' && finalDecision.visibility !== 'hide') {
                finalDecision = { visibility: 'warn', reason: `${label.val}`, source };
            }
        }
    }
    
    return finalDecision;
}