# 📱 Takaka - Guia de Teste Android

Este guia explica como testar o app Takaka no Android usando tanto APK standalone quanto Expo Go.

## 🚀 Configuração Realizada

### ✅ **Preparações Completas:**
- **Assets**: Ícones e splash screen básicos gerados
- **Permissões Android**: Camera, áudio, storage configuradas
- **Build Profiles**: Development, Preview e Production configurados
- **EAS CLI**: Verificado e funcional (usuário: celozaga)
- **Expo Go Compatibility**: Erros principais corrigidos (lucide-react → @expo/vector-icons)
- **Build Dependencies**: expo-dev-client instalado para development builds

### ⚠️ **Limitação Atual:**
- **EAS Builds**: Cota gratuita mensal esgotada (redefine em 5 dias)
- **Solução Temporária**: Use Expo Go para testes imediatos

## 📱 Opção 1: Teste via Expo Go (Mais Rápido)

### **1. Instalar Expo Go**
```bash
# No seu dispositivo Android, instale via Google Play Store:
# "Expo Go" by Expo
```

### **2. Iniciar o Servidor de Desenvolvimento**
```bash
npm start
# ou
npx expo start
```

### **3. Conectar o Dispositivo**
- **QR Code**: Escaneie o QR code com o app Expo Go
- **URL Manual**: Use a URL exibida no terminal
- **Tunnel**: Se estiver em redes diferentes, use `npx expo start --tunnel`

### **4. Teste via Expo Go**
```bash
# Para forçar modo Android
npm run android

# Para modo tunnel (se necessário)
npx expo start --tunnel --android
```

## 📦 Opção 2: Build APK Standalone

### **Builds Disponíveis:**

#### **🔧 Development APK (Recomendado para teste)**
```bash
# Build de desenvolvimento com debugging
npm run build:android:dev

# Ou comando completo
npx eas build --profile development --platform android
```

#### **🚀 Preview APK (Para testes externos)**
```bash
# Build para compartilhar com testadores
npm run build:android:preview

# Ou comando completo  
npx eas build --profile preview --platform android
```

#### **📱 Production APK**
```bash
# Build para produção
npm run build:android:prod

# Ou comando completo
npx eas build --profile production --platform android
```

## ⚙️ Configurações Detalhadas

### **Build Profiles (eas.json):**

```json
{
  "development": {
    "developmentClient": true,
    "distribution": "internal",
    "android": {
      "buildType": "apk",
      "gradleCommand": ":app:assembleDebug"
    }
  },
  "preview": {
    "distribution": "internal", 
    "android": {
      "buildType": "apk",
      "gradleCommand": ":app:assembleRelease"
    }
  },
  "production": {
    "android": {
      "buildType": "aab"
    }
  }
}
```

### **Permissões Android:**
- ✅ **CAMERA**: Para captura de fotos/vídeos
- ✅ **RECORD_AUDIO**: Para vídeos com áudio
- ✅ **READ_EXTERNAL_STORAGE**: Para acessar galeria
- ✅ **WRITE_EXTERNAL_STORAGE**: Para salvar mídia
- ✅ **INTERNET**: Para conectar com Bluesky
- ✅ **ACCESS_NETWORK_STATE**: Para verificar conectividade

## 🔄 Comandos de Teste Rápido

### **Desenvolvimento Local:**
```bash
# Iniciar servidor local
npm start

# Testar no emulador Android (se configurado)
npm run android

# Gerar assets se necessário
npm run generate-assets
```

### **Build e Instalação:**
```bash
# 1. Fazer build de desenvolvimento
npm run build:android:dev

# 2. Aguardar o build completar (10-15 minutos)
# 3. Baixar APK do link fornecido pelo EAS
# 4. Instalar no dispositivo Android
```

## 📲 Instalação do APK

### **No Dispositivo Android:**
1. **Habilitar "Origens Desconhecidas"** nas configurações
2. **Baixar o APK** do link fornecido pelo EAS Build
3. **Instalar** tocando no arquivo APK baixado
4. **Aceitar permissões** quando solicitado

### **Via ADB (Desenvolvedor):**
```bash
# Instalar APK via ADB
adb install caminho/para/takaka.apk

# Verificar logs do app
adb logcat | grep Takaka
```

## 🐛 Troubleshooting

### **Expo Go não conecta:**
```bash
# Usar tunnel para redes diferentes
npx expo start --tunnel

# Verificar firewall/antivírus
# Usar mesmo WiFi no PC e telefone
```

### **Build falha:**
```bash
# Verificar configuração
npx eas build:configure

# Verificar projeto
npx expo doctor

# Limpar cache
npx expo install --fix
```

### **APK não instala:**
- Verificar se "Instalar aplicativos desconhecidos" está habilitado
- Desinstalar versão anterior se existir
- Verificar espaço disponível no dispositivo
- Tentar instalar via ADB

### **Erro de permissões:**
- Verificar se todas as permissões foram aceitas
- Ir em Configurações > Apps > Takaka > Permissões
- Habilitar Camera, Microfone, Armazenamento

## 🎯 Testes Recomendados

### **Funcionalidades Principais:**
1. **Login/Logout**: Testar autenticação Bluesky
2. **Feeds**: Verificar carregamento de posts visuais
3. **Composer**: Testar upload de imagens/vídeos
4. **Watch**: Verificar reprodução de vídeos
5. **Compartilhamento**: Testar share nativo Android
6. **Bookmarks**: Verificar salvamento privado

### **Performance:**
- **Scroll suave** nos feeds
- **Carregamento rápido** de imagens/vídeos
- **Transições fluídas** entre telas
- **Consumo de bateria** razoável

## 📊 Monitoramento

### **Logs do App:**
```bash
# Logs detalhados via ADB
adb logcat | grep -E "(Takaka|ReactNativeJS|ExpoModules)"

# Logs do Expo Go
# Abrir Dev Menu no app → View Logs
```

### **Performance:**
```bash
# Monitor de performance
adb shell dumpsys package social.takaka.app

# Uso de memória
adb shell dumpsys meminfo social.takaka.app
```

## 🚀 Deploy de Builds

### **Build Status:**
- Acompanhe o progresso em: https://expo.dev/builds
- Receba notificações por email quando completar
- Downloads disponíveis por 30 dias

### **Distribuição:**
```bash
# Compartilhar build preview com testadores
# Link público gerado automaticamente pelo EAS

# Para builds internas
npx eas build:list
```

---

## 🎉 Próximos Passos

1. **✅ Teste via Expo Go** (mais rápido)
2. **🔧 Build de desenvolvimento** se Expo Go não for suficiente  
3. **🚀 Build preview** para testes externos
4. **📱 Build production** quando estiver pronto

**Está tudo configurado e pronto para testes Android!** 🎯
