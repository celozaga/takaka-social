
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUI } from '../../context/UIContext';
import ScreenHeader from '../layout/ScreenHeader';
import { supportedLanguages } from '../../lib/i18n';
import { Check } from 'lucide-react';
import Head from '../shared/Head';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

const LanguageSettingsScreen: React.FC = () => {
    const { setCustomFeedHeaderVisible } = useUI();
    const { t, i18n } = useTranslation();

    React.useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    const changeLanguage = (langCode: string) => {
        i18n.changeLanguage(langCode);
    };

    return (
        <>
            <Head><title>{t('languageSettings.title')}</title></Head>
            <View style={styles.container}>
                <ScreenHeader title={t('languageSettings.title')} />
                <ScrollView style={styles.scrollView}>
                    <Text style={styles.description}>{t('languageSettings.description')}</Text>
                    <View style={styles.listContainer}>
                        {supportedLanguages.map(lang => (
                            <Pressable
                                key={lang.code}
                                onPress={() => changeLanguage(lang.code)}
                                style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}
                            >
                                <Text style={styles.langName}>{lang.name}</Text>
                                {i18n.language.startsWith(lang.code) && <Check color="#A8C7FA" size={20} />}
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        padding: 16,
    },
    description: {
        color: '#C3C6CF', // on-surface-variant
        fontSize: 14,
        marginBottom: 16,
    },
    listContainer: {
        backgroundColor: '#1E2021', // surface-2
        borderRadius: 12,
        overflow: 'hidden',
    },
    listItem: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    listItemPressed: {
        backgroundColor: '#2b2d2e',
    },
    langName: {
        fontWeight: '600',
        color: '#E2E2E6',
        fontSize: 16,
    },
});

export default LanguageSettingsScreen;
