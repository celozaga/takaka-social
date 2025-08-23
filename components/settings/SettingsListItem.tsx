import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { ChevronRight, Loader2 } from 'lucide-react';
import { theme } from '@/lib/theme';

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
        <View style={[theme.settingsStyles.item, disabled && theme.settingsStyles.disabled]}>
            <View style={theme.settingsStyles.itemLeft}>
                <Icon
                    style={theme.settingsStyles.icon}
                    color={isDestructive ? theme.colors.error : theme.colors.onSurfaceVariant}
                    size={24}
                />
                <View style={theme.settingsStyles.itemTextContainer}>
                    <Text style={[theme.settingsStyles.label, isDestructive && theme.settingsStyles.destructiveLabel]}>{label}</Text>
                    {sublabel && <Text style={theme.settingsStyles.sublabel}>{sublabel}</Text>}
                </View>
            </View>
            <View style={theme.settingsStyles.itemRight}>
                {value && <Text style={theme.settingsStyles.value}>{value}</Text>}
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
        pressed && !disabled && theme.settingsStyles.pressed,
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

export default SettingsListItem;
