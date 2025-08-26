# Implementação das Configurações do App Takaka Social

Este documento descreve as funcionalidades de configurações implementadas no app Takaka Social, baseadas no app oficial do Bluesky e na documentação ATProto.

## 🎯 Funcionalidades Implementadas

### 1. Tela Principal de Configurações (`/settings`)
- **Moderação**: Configurações de moderação e filtros de conteúdo
- **Idioma**: Seleção do idioma da interface
- **Notificações**: Configurações de notificações push
- **Conta**: Configurações básicas da conta
- **Privacidade**: Configurações de privacidade e visibilidade
- **Feeds**: Personalização de feeds e exibição
- **Acessibilidade**: Opções de acessibilidade
- **Avançado**: Configurações técnicas e avançadas

### 2. Configurações de Privacidade (`/settings/privacy`)
- **Visibilidade do Perfil**:
  - Perfil visível publicamente
  - Seguindo visível
  - Seguidores visíveis
- **Visibilidade do Conteúdo**:
  - Posts visíveis
  - Respostas visíveis
  - Menções visíveis

### 3. Configurações de Feeds (`/settings/feeds`)
- **Opções de Exibição**:
  - Atualização automática
  - Mostrar apenas mídia
  - Mostrar reposts
- **Gestão de Feeds**:
  - Feeds fixados
  - Feeds salvos
  - Ações de pin/unpin/remover

### 4. Configurações de Acessibilidade (`/settings/accessibility`)
- **Visual**:
  - Reduzir movimento
  - Aumentar contraste
  - Texto maior
  - Texto em negrito
- **Mídia**:
  - Reproduzir vídeos automaticamente
  - Mostrar texto alternativo
- **Interação**:
  - Efeitos sonoros
  - Feedback tátil

### 5. Configurações Avançadas (`/settings/advanced`)
- **Informações da Conta**:
  - DID (Identificador Decentralizado)
  - Handle
  - Servidor PDS
- **Gerenciamento de Dados**:
  - Exportar dados
  - Limpar cache
- **Zona de Perigo**:
  - Desativar conta
  - Excluir conta
- **Técnico**:
  - Modo de depuração
  - Versão da API

## 🏗️ Arquitetura e Componentes

### Estrutura de Arquivos
```
app/settings/
├── account.tsx
├── language.tsx
├── notifications.tsx
├── moderation.tsx
├── muted-words.tsx
├── muted-accounts.tsx
├── privacy.tsx          # Nova
├── feeds.tsx            # Nova
├── accessibility.tsx     # Nova
└── advanced.tsx         # Nova

components/settings/
├── SettingsScreen.tsx
├── AccountSettingsScreen.tsx
├── LanguageSettingsScreen.tsx
├── NotificationSettingsScreen.tsx
├── ModerationSettingsScreen.tsx
├── MutedWordsScreen.tsx
├── MutedAccountsScreen.tsx
├── PrivacySettingsScreen.tsx      # Novo
├── FeedSettingsScreen.tsx         # Novo
├── AccessibilitySettingsScreen.tsx # Novo
└── AdvancedSettingsScreen.tsx     # Novo
```

### Componentes Reutilizáveis
- `SettingsListItem`: Item de configuração com ícone, label e controles
- `SettingsDivider`: Separador visual entre itens
- `ToggleSwitch`: Switch para configurações booleanas
- `ScreenHeader`: Cabeçalho padrão das telas

## 🌐 Internacionalização

### Idiomas Suportados
- **Português (pt)**: Traduções completas implementadas
- **Inglês (en)**: Traduções completas implementadas
- **Espanhol (es)**: Traduções completas implementadas

### Chaves de Tradução
Todas as novas funcionalidades seguem o padrão de nomenclatura:
- `privacySettings.*`
- `feedSettings.*`
- `accessibilitySettings.*`
- `advancedSettings.*`

## 🔧 Implementação Técnica

### Estado e Gerenciamento
- Cada tela gerencia seu próprio estado local
- Uso de `useState` para configurações
- Uso de `useEffect` para carregamento inicial
- Integração com `useAtp` para operações ATProto

### Integração ATProto
- **✅ Implementado**: Carregamento de preferências via `agent.app.bsky.actor.getPreferences()`
- **✅ Implementado**: Salvamento via `agent.app.bsky.actor.putPreferences()`
- **🔄 Redirecionamento**: Funcionalidades não suportadas redirecionam para [bsky.app](https://bsky.app/settings/account)

### Funcionalidades Suportadas pela API
- **Privacidade**: Configurações de visibilidade de perfil e conteúdo
- **Feeds**: Preferências de feeds e exibição
- **Moderação**: Filtros de conteúdo e palavras silenciadas
- **Notificações**: Configurações de notificações push

### Funcionalidades Redirecionadas
- **Alteração de senha**: Redireciona para `https://bsky.app/settings/password`
- **Data de nascimento**: Redireciona para `https://bsky.app/settings/birthday`
- **Exportação de dados**: Redireciona para `https://bsky.app/settings/account`
- **Desativação de conta**: Redireciona para `https://bsky.app/settings/account`
- **Exclusão de conta**: Redireciona para `https://bsky.app/settings/account`

### Tratamento de Erros
- Toast notifications para sucesso/erro
- Fallback para valores padrão em caso de falha
- Reversão de mudanças em caso de erro

## 🎨 Design System

### Consistência Visual
- Uso consistente dos componentes existentes
- Seguindo o tema definido em `lib/theme.ts`
- Ícones do Lucide React para consistência
- Espaçamento e tipografia padronizados

### Responsividade
- Suporte para web e mobile
- Adaptação automática para diferentes tamanhos de tela
- Uso de `Platform.OS` para comportamentos específicos

## 🚀 Próximos Passos

### Implementações Pendentes
1. **✅ Integração ATProto**: Conectado com as APIs reais do Bluesky
2. **🔄 Persistência Local**: Implementar AsyncStorage para configurações de acessibilidade
3. **🔄 Sincronização**: Sincronizar configurações entre dispositivos
4. **✅ Validação**: Validação de entrada e feedback visual implementados
5. **🔄 Testes**: Testes unitários e de integração

### Implementações Concluídas
1. **✅ Integração ATProto**: Todas as funcionalidades suportadas pela API implementadas
2. **✅ Redirecionamento**: Funcionalidades não suportadas redirecionam para o site oficial
3. **✅ Internacionalização**: Traduções completas em PT, EN e ES
4. **✅ Design System**: Uso consistente dos componentes existentes
5. **✅ Tratamento de Erros**: Toast notifications e fallbacks implementados

### Funcionalidades Futuras
1. **Backup/Restore**: Backup das configurações
2. **Import/Export**: Compartilhar configurações
3. **Templates**: Configurações pré-definidas
4. **Análytics**: Métricas de uso das configurações

## 📚 Referências

- [Documentação ATProto](https://docs.bsky.app/)
- [Repositório Oficial Bluesky](https://github.com/bluesky-social/social-app)
- [Especificações ATProto](https://atproto.com/specs/)

## 🤝 Contribuição

Para contribuir com melhorias nas configurações:

1. Siga o padrão de código existente
2. Use os componentes reutilizáveis
3. Adicione traduções para todos os idiomas
4. Teste em diferentes plataformas
5. Documente mudanças significativas

---

**Nota**: Esta implementação segue os princípios de design modular e limpo, mantendo o código organizado e fácil de manter e expandir.
