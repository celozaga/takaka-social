
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

interface ScreenHeaderProps {
    title: string;
    children?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, children }) => {
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.innerContainer}>
                <View style={styles.leftContainer}>
                    <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]} accessibilityLabel={t('common.back')}>
                        <ArrowLeft size={20} color="#E2E2E6" />
                    </Pressable>
                    <Text style={styles.title}>{title}</Text>
                </View>
                {children && <View style={styles.rightContainer}>{children}</View>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        backgroundColor: '#111314', // surface-1
        height: 64,
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#2b2d2e', // surface-3
    },
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 999,
    },
    backButtonPressed: {
        backgroundColor: '#2b2d2e', // surface-3
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E2E2E6',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});

export default ScreenHeader;
