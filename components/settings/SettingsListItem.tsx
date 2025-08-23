import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { ChevronRight, Loader2 } from 'lucide-react';
import { settingsStyles, theme } from '@/lib/theme';

interface SettingsListItemProps {
    icon: React.ElementType;
    label: string;
    sublabel?: string;
    href?: string;
    onPress?: () => void;
    isDestructive?: boolean;
    isLoading?: boolean;
    disabled?: boolean;
    value?: React.ReactNode;
    control?: React.ReactNode;
}

export const SettingsListItem: React.FC<SettingsListItemProps> = ({
    icon: Icon,
    label,
    sublabel,
    href,
    onPress,
    isDestructive = false,
    isLoading = false,
    disabled = false,
    value,
    control
}) => {
    const content = (
        <View style={[settingsStyles.item, disabled && settingsStyles.disabled]}>
            <View style={styles.itemLeft}>
                <Icon
                    style={settingsStyles.icon}
                    color={isDestructive ? theme.colors.error : theme.colors.onSurfaceVariant}
                    size={24}
                />
                <View style={styles.itemTextContainer}>
                    <Text style={[settingsStyles.label, isDestructive && settingsStyles.destructiveLabel]}>{label}</Text>
                    {sublabel && <Text style={settingsStyles.sublabel}>{sublabel}</Text>}
                </View>
            </View>
            <View style={styles.itemRight}>
                {value && <Text style={settingsStyles.value}>{value}</Text>}
                {control}
                {isLoading ? (
                    <Loader2 color={theme.colors.onSurfaceVariant} size={20} style={{ animation: 'spin 1s linear infinite' } as any} />
                ) : (
                    (href || onPress) && !control && <ChevronRight color={theme.colors.onSurfaceVariant} size={20} />
                )}
            </View>
        </View>
    );

    const pressableStyle = ({ pressed }: { pressed: boolean }) => [
        pressed && !disabled && settingsStyles.pressed,
    ];

    if (href) {
        return (
            <Link href={href as any} asChild disabled={disabled}>
                <Pressable style={pressableStyle}>{content}</Pressable>
            </Link>
        );
    }

    return (
        <Pressable onPress={onPress} disabled={disabled} style={pressableStyle}>
            {content}
        </Pressable>
    );
};

// Use a simplified version of the main styles object for this component
const styles = {
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.l,
        flexShrink: 1,
    } as const,
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    } as const,
    itemTextContainer: {
        flexShrink: 1,
    } as const,
};

export default SettingsListItem;