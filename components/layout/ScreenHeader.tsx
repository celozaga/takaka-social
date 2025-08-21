import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import TopAppBar from '../ui/TopAppBar';
import theme from '@/lib/theme';

interface ScreenHeaderProps {
    title: string;
    children?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, children }) => {
    const { t } = useTranslation();
    const router = useRouter();

    const leadingAction = (
        <Pressable 
            onPress={() => router.back()} 
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} 
            accessibilityLabel={t('common.back')}
        >
            <ArrowLeft size={24} color={theme.colors.onSurface} />
        </Pressable>
    );

    return (
        <TopAppBar title={title} leading={leadingAction} actions={children} />
    );
};

const styles = StyleSheet.create({
    button: {
        padding: theme.spacing.s,
        marginLeft: -theme.spacing.s, // To align with edge
        borderRadius: theme.shape.full,
    },
    buttonPressed: {
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
});

export default ScreenHeader;
