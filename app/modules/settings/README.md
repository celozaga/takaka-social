# Layout Padronizado para Telas de Configurações

Este documento explica como usar o sistema de layout padronizado para criar novas telas de configurações de forma consistente.

## Componentes Base

### `SettingsScreenLayout`
Componente principal que fornece a estrutura base para todas as telas de configurações:

```tsx
import SettingsScreenLayout from './SettingsScreenLayout';

<SettingsScreenLayout
    title="Título da Tela"
    description="Descrição opcional da tela"
    showHeader={true} // opcional, padrão: true
>
    {/* Conteúdo da tela */}
</SettingsScreenLayout>
```

### `SettingsSection`
Componente para agrupar itens relacionados em seções:

```tsx
import { SettingsSection } from './SettingsScreenLayout';

<SettingsSection title="Nome da Seção">
    {/* Itens da seção */}
</SettingsSection>

// Seção sem título (para a primeira seção)
<SettingsSection>
    {/* Itens da seção */}
</SettingsSection>
```

## Estrutura Padrão

Todas as telas de configurações seguem esta estrutura:

```tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import Head from 'expo-router/head';
import SettingsListItem from './SettingsListItem';
import SettingsDivider from '@/components/ui/SettingsDivider';
import ToggleSwitch from '../ui/ToggleSwitch';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';

const NovaTelaSettings: React.FC = () => {
    const { t } = useTranslation();
    const { session } = useAtp();
    const { toast } = useToast();
    
    // Estado e lógica da tela...

    return (
        <>
            <Head><title>{t('novaTela.title')}</title></Head>
            <SettingsScreenLayout
                title={t('novaTela.title')}
                description={t('novaTela.description')}
            >
                {/* Primeira seção (sem título) */}
                <SettingsSection>
                    <SettingsListItem
                        icon={Icone}
                        label={t('novaTela.item1')}
                        sublabel={t('novaTela.item1Desc')}
                        control={
                            <ToggleSwitch
                                checked={setting1}
                                onChange={handleSetting1Change}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Icone2}
                        label={t('novaTela.item2')}
                        href="/rota/item2"
                    />
                </SettingsSection>

                {/* Seções com títulos */}
                <SettingsSection title={t('novaTela.secao2')}>
                    <SettingsListItem
                        icon={Icone3}
                        label={t('novaTela.item3')}
                        onPress={handleItem3Press}
                    />
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default NovaTelaSettings;
```

## Vantagens do Sistema

1. **Consistência Visual**: Todas as telas seguem o mesmo padrão de layout
2. **Manutenibilidade**: Mudanças no design são aplicadas automaticamente a todas as telas
3. **Reutilização**: Não é necessário reescrever a estrutura básica
4. **Padronização**: Espaçamentos, cores e tipografia são consistentes
5. **Desenvolvimento Rápido**: Foco na lógica da tela, não no layout

## Estilos Disponíveis

O sistema usa os estilos definidos em `lib/theme.ts`:

- `theme.settingsStyles.container`: Container principal com padding e gap
- `theme.settingsStyles.section`: Seções com background e bordas arredondadas
- `theme.settingsStyles.sectionHeader`: Títulos das seções
- `theme.settingsStyles.description`: Descrição da tela

## Exemplos de Uso

### Tela Simples (apenas lista)
```tsx
<SettingsScreenLayout title="Configurações Simples">
    <SettingsSection>
        <SettingsListItem icon={User} label="Perfil" href="/profile" />
        <SettingsDivider />
        <SettingsListItem icon={Settings} label="Geral" href="/general" />
    </SettingsSection>
</SettingsScreenLayout>
```

### Tela com Controles
```tsx
<SettingsScreenLayout title="Configurações com Controles">
    <SettingsSection title="Preferências">
        <SettingsListItem
            icon={Bell}
            label="Notificações"
            control={<ToggleSwitch checked={notifications} onChange={setNotifications} />}
        />
    </SettingsSection>
</SettingsScreenLayout>
```

### Tela com Descrição
```tsx
<SettingsScreenLayout 
    title="Configurações Avançadas"
    description="Configure opções avançadas do aplicativo"
>
    {/* Conteúdo */}
</SettingsScreenLayout>
```

## Boas Práticas

1. **Sempre use `SettingsSection`** para agrupar itens relacionados
2. **Primeira seção sem título** para itens principais
3. **Use `SettingsDivider`** entre itens da mesma seção
4. **Mantenha consistência** nos ícones e labels
5. **Siga o padrão de tradução** estabelecido
6. **Use os componentes existentes** (`SettingsListItem`, `ToggleSwitch`, etc.)

## Componentes Suportados

- `SettingsListItem`: Item de configuração com ícone, label e opcionalmente sublabel, control, href, onPress
- `ToggleSwitch`: Switch para configurações booleanas
- `SettingsDivider`: Separador visual entre itens
- `ActivityIndicator`: Para estados de carregamento
- `Pressable`: Para ações customizadas

## Migração de Telas Existentes

Para migrar uma tela existente:

1. Substitua `View` + `ScreenHeader` + `ScrollView` por `SettingsScreenLayout`
2. Substitua `View` + `Text` + `View` por `SettingsSection`
3. Remova imports desnecessários (`theme`, `View`, `Text`, `ScrollView`)
4. Mantenha a lógica da tela inalterada
5. Teste para garantir que a funcionalidade permanece igual
