
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Takaka Social - App de Redes Sociais

Este é um aplicativo de redes sociais baseado no protocolo ATProto (Bluesky), desenvolvido com React Native/Expo.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Autenticação**: Login e gerenciamento de sessão ATProto
- **Feed**: Visualização de posts e feeds personalizados
- **Perfil**: Visualização e edição de perfis de usuário
- **Configurações**: Sistema completo de configurações com layout padronizado
- **Internacionalização**: Suporte para PT, EN e ES
- **Design System**: Tema consistente e componentes reutilizáveis

### 🔄 Em Desenvolvimento
- Sistema de mensagens
- Notificações push
- Moderação de conteúdo
- Gestão de feeds personalizados

## 🏗️ Arquitetura

### Sistema de Layout Padronizado
O app utiliza um sistema de layout padronizado para todas as telas de configurações:

- **`SettingsScreenLayout`**: Componente base que fornece estrutura consistente
- **`SettingsSection`**: Agrupamento de itens relacionados em seções
- **Componentes Reutilizáveis**: `SettingsListItem`, `ToggleSwitch`, `SettingsDivider`

#### Vantagens:
- ✅ **Consistência Visual**: Todas as telas seguem o mesmo padrão
- ✅ **Manutenibilidade**: Mudanças no design são aplicadas automaticamente
- ✅ **Desenvolvimento Rápido**: Foco na lógica, não no layout
- ✅ **Reutilização**: Não é necessário reescrever estrutura básica

### Estrutura de Configurações
```
/settings
├── /privacy          # Configurações de privacidade
├── /feeds            # Gestão de feeds
├── /accessibility    # Configurações de acessibilidade
├── /advanced         # Configurações avançadas
├── /moderation       # Moderação de conteúdo
├── /language         # Configurações de idioma
└── /notifications    # Configurações de notificações
```

## 🛠️ Tecnologias

- **Frontend**: React Native + Expo
- **Navegação**: Expo Router
- **Estado**: React Context + Hooks
- **Protocolo**: ATProto (Bluesky)
- **Internacionalização**: react-i18next
- **UI**: Componentes customizados + Lucide React

## 📱 Como Executar

### Pré-requisitos
- Node.js 18+
- Expo CLI
- Conta Bluesky (para funcionalidades de rede)

### Instalação
1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/takaka-social.git
   cd takaka-social
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env.local
   # Edite .env.local com suas configurações
   ```

4. Execute o app:
   ```bash
   npm run dev
   ```

## 🎨 Design System

### Tema
- **Cores**: Paleta escura com acentos primários
- **Tipografia**: Sistema hierárquico de fontes
- **Espaçamento**: Sistema de espaçamento consistente (xs, s, m, l, xl, xxl)
- **Formas**: Bordas arredondadas e sombras sutis

### Componentes
- **`SettingsListItem`**: Item de configuração com ícone, label e controles
- **`ToggleSwitch`**: Switch para configurações booleanas
- **`SettingsDivider`**: Separador visual entre itens
- **`ScreenHeader`**: Cabeçalho padrão das telas

## 🌐 Internacionalização

O app suporta múltiplos idiomas através do sistema de traduções:

- **Português (PT)**: Idioma padrão
- **Inglês (EN)**: Traduções completas
- **Espanhol (ES)**: Traduções em desenvolvimento

### Adicionando Novos Idiomas
1. Crie arquivo em `locales/[codigo]/translation.json`
2. Adicione as traduções necessárias
3. Configure o idioma em `lib/i18n.ts`

## 📚 Documentação

- **Layout de Configurações**: [components/settings/README.md](components/settings/README.md)
- **Tema e Estilos**: [lib/theme.ts](lib/theme.ts)
- **Componentes UI**: [components/ui/](components/ui/)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código
- Use o sistema de layout padronizado para novas telas de configurações
- Siga o padrão de nomenclatura estabelecido
- Mantenha a consistência com o design system
- Documente novas funcionalidades

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🔗 Links Úteis

- [Protocolo ATProto](https://atproto.com/)
- [Documentação Bluesky](https://docs.bsky.app/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)

---

<div align="center">
Made with ❤️ by the Takaka Social Team
</div>