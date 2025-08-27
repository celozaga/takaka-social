import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '@/components/shared';
import { Settings, User, Shield } from 'lucide-react';
import Head from 'expo-router/head';
import SettingsListItem from './SettingsListItem';
import { SettingsDivider, Switch } from '@/components/shared';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';

/**
 * Template para novas telas de configurações
 * 
 * Este arquivo serve como exemplo de como criar novas telas
 * de configurações usando o sistema de layout padronizado.
 * 
 * Para usar:
 * 1. Copie este arquivo
 * 2. Renomeie para sua nova tela
 * 3. Modifique o conteúdo conforme necessário
 * 4. Mantenha a estrutura base
 */
const SettingsTemplate: React.FC = () => {
    const { t } = useTranslation();
    const { session } = useAtp();
    const { toast } = useToast();
    
    // Estado da tela
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        setting1: false,
        setting2: true,
        setting3: false,
    });

    // Carregar configurações ao montar o componente
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        if (!session) return;
        
        try {
            setIsLoading(true);
            // TODO: Implementar carregamento das configurações
            // Exemplo: const { data } = await agent.app.bsky.actor.getPreferences();
            
            // Configurações padrão
            setSettings({
                setting1: false,
                setting2: true,
                setting3: false,
            });
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast({
                title: t('common.error'),
                description: 'Erro ao carregar configurações',
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingToggle = async (key: keyof typeof settings, value: boolean) => {
        if (!session) return;
        
        try {
            setIsSaving(true);
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings);
            
            // TODO: Implementar salvamento das configurações
            // Exemplo: await agent.app.bsky.actor.putPreferences({ preferences: [...] });
            
            toast({
                title: t('common.success'),
                description: 'Configuração salva com sucesso'
            });
        } catch (error) {
            console.error('Failed to save setting:', error);
            toast({
                title: t('common.error'),
                description: 'Erro ao salvar configuração',
                variant: "destructive"
            });
            // Reverter em caso de falha
            setSettings(settings);
        } finally {
            setIsSaving(false);
        }
    };

    const handleItemPress = () => {
        // TODO: Implementar ação do item
        toast({
            title: t('common.info'),
            description: 'Ação do item implementada'
        });
    };

    return (
        <>
            <Head><title>Template de Configurações</title></Head>
            <SettingsScreenLayout
                title="Template de Configurações"
                description="Esta é uma descrição da tela de configurações"
            >
                {/* Primeira seção (sem título) - para itens principais */}
                <SettingsSection>
                    <SettingsListItem
                        icon={Settings}
                        label="Configuração Principal"
                        sublabel="Descrição da configuração principal"
                        control={
                            <Switch
                                checked={settings.setting1}
                                onChange={(value) => handleSettingToggle('setting1', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={User}
                        label="Item de Navegação"
                        sublabel="Clique para navegar para outra tela"
                        href="/settings/outra-tela"
                    />
                </SettingsSection>

                {/* Seções com títulos para agrupar itens relacionados */}
                <SettingsSection title="Configurações Avançadas">
                    <SettingsListItem
                        icon={Shield}
                        label="Configuração de Segurança"
                        sublabel="Descrição da configuração de segurança"
                        control={
                            <Switch
                                checked={settings.setting2}
                                onChange={(value) => handleSettingToggle('setting2', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Settings}
                        label="Configuração Personalizada"
                        sublabel="Descrição da configuração personalizada"
                        control={
                            <Switch
                                checked={settings.setting3}
                                onChange={(value) => handleSettingToggle('setting3', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                </SettingsSection>

                {/* Seção para ações */}
                <SettingsSection title="Ações">
                    <SettingsListItem
                        icon={Settings}
                        label="Ação Personalizada"
                        sublabel="Clique para executar uma ação"
                        onPress={handleItemPress}
                    />
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default SettingsTemplate;
