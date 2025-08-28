import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/shared';
import { Tooltip, TooltipContentKey } from '@/components/shared/Tooltip';

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
    /** Tooltip content key for help text */
    tooltipKey?: TooltipContentKey;
    /** Custom tooltip content (overrides tooltipKey) */
    tooltipContent?: string;
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
    control,
    tooltipKey,
    tooltipContent
}) => {
    const { theme } = useTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);
    const content = (
        <View style={[styles.item, disabled && styles.disabled]}>
            <View style={styles.itemLeft}>
                <Icon
                    style={styles.icon}
                    color={isDestructive ? theme.colors.error : theme.colors.onSurfaceVariant}
                    size={24}
                />
                <View style={styles.itemTextContainer}>
                    <Text style={[styles.label, isDestructive && styles.destructiveLabel]}>{label}</Text>
                    {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
                </View>
            </View>
            <View style={styles.itemRight}>
                {value && <Text style={styles.value}>{value}</Text>}
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
        pressed && !disabled && styles.pressed,
    ];

    const renderContent = () => {
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

    // Wrap with tooltip if tooltip content is provided
    if (tooltipKey || tooltipContent) {
        return (
            <Tooltip 
                contentKey={tooltipKey} 
                content={tooltipContent}
                position="right"
            >
                {renderContent()}
            </Tooltip>
        );
    }

    return renderContent();
};

const createStyles = (theme: any) => StyleSheet.create({
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.lg,
        backgroundColor: 'transparent',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.lg,
        flex: 1,
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    itemTextContainer: {
        flex: 1,
    },
    icon: {
        width: 24,
        height: 24,
    },
    label: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        color: theme.colors.onSurface,
    },
    sublabel: {
        ...theme.typography.bodyMedium,
        color: theme.colors.onSurfaceVariant,
        marginTop: 2,
    },
    value: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
    },
    destructiveLabel: {
        color: theme.colors.error,
    },
    disabled: {
        opacity: 0.5,
    },
    pressed: {
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
});

export default SettingsListItem;
