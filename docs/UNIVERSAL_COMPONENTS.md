# 🎯 Sistema de Componentes Universais - Takaka Social

## 📋 **Visão Geral**

O sistema de componentes universais foi criado para **eliminar completamente** a necessidade de criar layouts customizados ou componentes UI do zero. Com esses componentes, adicionar ou remover features se torna **extremamente simples** com **mínimo atrito**.

## 🚀 **Princípios de Design**

### **1. Zero Atrito**
- **Não crie layouts customizados** - Use os containers pré-definidos
- **Não crie botões customizados** - Use `UniversalButton` com variantes
- **Não crie inputs customizados** - Use `UniversalInput` ou `SearchInput`
- **Não crie modais customizados** - Use `UniversalModal` ou `ConfirmDialog`

### **2. Consistência Total**
- Todos os componentes seguem o **design system** do app
- **Cores, espaçamentos e tipografia** são automaticamente aplicados
- **Comportamento responsivo** é consistente em todas as plataformas

### **3. Flexibilidade Máxima**
- Cada componente aceita **props opcionais** para customização
- **Variantes predefinidas** para diferentes casos de uso
- **Hooks utilitários** para estados comuns

## 🏗️ **Arquitetura dos Componentes**

```
components/ui/UniversalComponents.tsx
├── Containers & Layout
│   ├── ScreenContainer      # Container principal para qualquer tela
│   ├── ContentSection      # Seção de conteúdo com título/descrição
│   └── ItemList           # Lista de itens com estados vazios/loading
├── Inputs & Controles
│   ├── UniversalInput      # Input de texto para qualquer formulário
│   └── SearchInput        # Input de busca para qualquer tela
├── Botões & Ações
│   ├── UniversalButton     # Botão para qualquer ação
│   └── FloatingActionButton # FAB para ações rápidas
├── Modais & Diálogos
│   ├── UniversalModal      # Modal para qualquer conteúdo
│   └── ConfirmDialog      # Dialog de confirmação
├── Feedback & Estados
│   ├── LoadingIndicator    # Indicador de loading
│   └── EmptyState         # Estado vazio para listas
└── Hooks Utilitários
    ├── useAsyncState       # Gerenciar estados async
    └── useForm            # Gerenciar formulários
```

## 📱 **Como Usar - Exemplos Práticos**

### **1. Criando uma Nova Tela (Zero Layout Customizado)**

```tsx
import { ScreenContainer, ContentSection, UniversalButton } from '@/components/ui/UniversalComponents';

const NovaFeatureScreen: React.FC = () => {
    return (
        <ScreenContainer>
            <ContentSection 
                title="Nova Feature" 
                description="Descrição da nova funcionalidade"
            >
                <UniversalButton 
                    title="Ação Principal" 
                    onPress={() => {}} 
                    variant="primary"
                />
            </ContentSection>
        </ScreenContainer>
    );
};
```

**Resultado**: Tela completa com layout consistente, sem escrever nenhum CSS ou layout customizado.

### **2. Criando uma Lista de Itens (Zero Estado Customizado)**

```tsx
import { ItemList, EmptyState, LoadingIndicator } from '@/components/ui/UniversalComponents';

const ListaScreen: React.FC = () => {
    const { data, loading, error } = useAsyncState();
    
    const items = data?.map(item => (
        <ItemComponent key={item.id} item={item} />
    )) || [];
    
    return (
        <ItemList 
            items={items}
            loading={loading}
            emptyMessage="Nenhum item encontrado"
            separator={<Divider />}
        />
    );
};
```

**Resultado**: Lista com estados de loading, vazio e separadores automáticos.

### **3. Criando um Formulário (Zero Validação Customizada)**

```tsx
import { UniversalInput, useForm, UniversalButton } from '@/components/ui/UniversalComponents';

const FormularioScreen: React.FC = () => {
    const form = useForm({
        nome: '',
        email: '',
        mensagem: ''
    });
    
    return (
        <ScreenContainer>
            <ContentSection title="Formulário">
                <UniversalInput
                    label="Nome"
                    value={form.values.nome}
                    onChangeText={(text) => form.setValue('nome', text)}
                    error={form.errors.nome}
                    onFocus={() => form.setTouchedField('nome')}
                />
                
                <UniversalInput
                    label="Email"
                    value={form.values.email}
                    onChangeText={(text) => form.setValue('email', text)}
                    error={form.errors.email}
                    onFocus={() => form.setTouchedField('email')}
                />
                
                <UniversalButton 
                    title="Enviar" 
                    onPress={handleSubmit}
                    disabled={!form.isValid}
                    fullWidth
                />
            </ContentSection>
        </ScreenContainer>
    );
};
```

**Resultado**: Formulário completo com validação automática e estados de erro.

### **4. Criando um Modal (Zero Estilização Customizada)**

```tsx
import { UniversalModal, UniversalButton } from '@/components/ui/UniversalComponents';

const ModalScreen: React.FC = () => {
    const [modalVisible, setModalVisible] = useState(false);
    
    return (
        <>
            <UniversalButton 
                title="Abrir Modal" 
                onPress={() => setModalVisible(true)}
            />
            
            <UniversalModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title="Título do Modal"
                size="medium"
                actions={[
                    <UniversalButton 
                        key="cancel" 
                        title="Cancelar" 
                        onPress={() => setModalVisible(false)}
                        variant="outline"
                    />,
                    <UniversalButton 
                        key="confirm" 
                        title="Confirmar" 
                        onPress={handleConfirm}
                        variant="primary"
                    />
                ]}
            >
                <Text>Conteúdo do modal aqui...</Text>
            </UniversalModal>
        </>
    );
};
```

**Resultado**: Modal completo com ações, sem escrever CSS ou lógica de posicionamento.

## 🎨 **Variantes e Customizações**

### **UniversalButton Variants**
```tsx
// Botão primário (padrão)
<UniversalButton title="Ação" onPress={() => {}} />

// Botão secundário
<UniversalButton title="Ação" onPress={() => {}} variant="secondary" />

// Botão de perigo
<UniversalButton title="Deletar" onPress={() => {}} variant="destructive" />

// Botão outline
<UniversalButton title="Cancelar" onPress={() => {}} variant="outline" />

// Tamanhos diferentes
<UniversalButton title="Pequeno" onPress={() => {}} size="small" />
<UniversalButton title="Grande" onPress={() => {}} size="large" />

// Botão com ícone
<UniversalButton 
    title="Ação" 
    onPress={() => {}} 
    icon={<IconComponent />}
/>

// Botão de largura total
<UniversalButton title="Ação" onPress={() => {}} fullWidth />
```

### **ScreenContainer Customizações**
```tsx
// Container com padding personalizado
<ScreenContainer padding="xl">
    {/* Conteúdo */}
</ScreenContainer>

// Container com cor de fundo personalizada
<ScreenContainer backgroundColor="surfaceContainer">
    {/* Conteúdo */}
</ScreenContainer>
```

### **ContentSection Customizações**
```tsx
// Seção com margem superior personalizada
<ContentSection 
    title="Título" 
    description="Descrição"
    marginTop="xl"
>
    {/* Conteúdo */}
</ContentSection>
```

## 🔧 **Hooks Utilitários**

### **useAsyncState - Gerenciar Estados Async**
```tsx
const { data, loading, error, execute, reset } = useAsyncState();

// Executar operação async
const handleFetch = async () => {
    try {
        const result = await execute(async () => {
            return await api.fetchData();
        });
        console.log('Dados carregados:', result);
    } catch (error) {
        // Erro já é gerenciado automaticamente
        console.log('Erro:', error);
    }
};

// Resetar estado
const handleReset = () => {
    reset();
};
```

### **useForm - Gerenciar Formulários**
```tsx
const form = useForm({
    nome: '',
    email: '',
    senha: ''
});

// Definir valor
form.setValue('nome', 'João');

// Definir erro
form.setError('email', 'Email inválido');

// Marcar campo como tocado
form.setTouchedField('senha');

// Resetar formulário
form.reset();

// Verificar se é válido
if (form.isValid) {
    // Enviar formulário
}
```

## 📚 **Casos de Uso Comuns**

### **1. Tela de Lista com Busca**
```tsx
const ListaComBuscaScreen: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { data, loading } = useAsyncState();
    
    const filteredItems = data?.filter(item => 
        item.nome.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
    
    return (
        <ScreenContainer>
            <SearchInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Buscar itens..."
                onClear={() => setSearchTerm('')}
            />
            
            <ItemList 
                items={filteredItems.map(item => (
                    <ItemComponent key={item.id} item={item} />
                ))}
                loading={loading}
                emptyMessage="Nenhum item encontrado"
            />
        </ScreenContainer>
    );
};
```

### **2. Tela de Formulário com Validação**
```tsx
const FormularioComValidacaoScreen: React.FC = () => {
    const form = useForm({
        titulo: '',
        descricao: '',
        categoria: ''
    });
    
    const handleSubmit = async () => {
        // Validar campos
        if (!form.values.titulo.trim()) {
            form.setError('titulo', 'Título é obrigatório');
            return;
        }
        
        if (!form.values.categoria) {
            form.setError('categoria', 'Categoria é obrigatória');
            return;
        }
        
        // Enviar formulário
        try {
            await api.submitForm(form.values);
            toast.success('Formulário enviado com sucesso!');
            form.reset();
        } catch (error) {
            toast.error('Erro ao enviar formulário');
        }
    };
    
    return (
        <ScreenContainer>
            <ContentSection title="Novo Item">
                <UniversalInput
                    label="Título *"
                    value={form.values.titulo}
                    onChangeText={(text) => form.setValue('titulo', text)}
                    error={form.errors.titulo}
                    onFocus={() => form.setTouchedField('titulo')}
                />
                
                <UniversalInput
                    label="Descrição"
                    value={form.values.descricao}
                    onChangeText={(text) => form.setValue('descricao', text)}
                    multiline
                    numberOfLines={3}
                />
                
                <UniversalButton 
                    title="Salvar" 
                    onPress={handleSubmit}
                    disabled={!form.isValid}
                    fullWidth
                />
            </ContentSection>
        </ScreenContainer>
    );
};
```

### **3. Tela com Modal de Confirmação**
```tsx
const TelaComConfirmacaoScreen: React.FC = () => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    
    const handleDelete = (item) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };
    
    const confirmDelete = async () => {
        try {
            await api.deleteItem(itemToDelete.id);
            toast.success('Item deletado com sucesso!');
            setShowDeleteModal(false);
            setItemToDelete(null);
        } catch (error) {
            toast.error('Erro ao deletar item');
        }
    };
    
    return (
        <ScreenContainer>
            <ContentSection title="Lista de Itens">
                {items.map(item => (
                    <View key={item.id}>
                        <Text>{item.nome}</Text>
                        <UniversalButton 
                            title="Deletar" 
                            onPress={() => handleDelete(item)}
                            variant="destructive"
                            size="small"
                        />
                    </View>
                ))}
            </ContentSection>
            
            <ConfirmDialog
                visible={showDeleteModal}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja deletar "${itemToDelete?.nome}"?`}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteModal(false)}
                confirmText="Deletar"
                cancelText="Cancelar"
                destructive
            />
        </ScreenContainer>
    );
};
```

## 🚫 **O que NÃO fazer**

### ❌ **NÃO crie layouts customizados**
```tsx
// ❌ ERRADO - Layout customizado
<View style={{
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
}}>
    {/* Conteúdo */}
</View>

// ✅ CORRETO - Use ScreenContainer
<ScreenContainer>
    {/* Conteúdo */}
</ScreenContainer>
```

### ❌ **NÃO crie botões customizados**
```tsx
// ❌ ERRADO - Botão customizado
<Pressable style={{
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8
}}>
    <Text style={{ color: '#fff' }}>Ação</Text>
</Pressable>

// ✅ CORRETO - Use UniversalButton
<UniversalButton title="Ação" onPress={() => {}} />
```

### ❌ **NÃO crie inputs customizados**
```tsx
// ❌ ERRADO - Input customizado
<TextInput style={{
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8
}} />

// ✅ CORRETO - Use UniversalInput
<UniversalInput 
    value={value} 
    onChangeText={setValue} 
    placeholder="Digite algo..."
/>
```

## 🎯 **Benefícios do Sistema**

### **1. Velocidade de Desenvolvimento**
- **Zero tempo** criando layouts
- **Zero tempo** estilizando componentes
- **Zero tempo** implementando estados comuns

### **2. Consistência Visual**
- **100% consistente** com o design system
- **Zero divergências** visuais entre telas
- **Manutenção automática** de padrões

### **3. Manutenibilidade**
- **Mudanças globais** em um só lugar
- **Zero duplicação** de código
- **Fácil atualização** de componentes

### **4. Escalabilidade**
- **Novas features** em minutos, não horas
- **Equipe maior** pode trabalhar sem conflitos
- **Onboarding** de novos devs é instantâneo

## 🔮 **Próximos Passos**

1. **Migrar telas existentes** para usar os componentes universais
2. **Criar novos componentes** conforme necessário
3. **Documentar padrões** específicos do app
4. **Implementar testes** para os componentes universais

---

**Lembre-se**: Com este sistema, adicionar uma nova feature deve levar **minutos, não horas**. Se você está escrevendo CSS ou criando layouts customizados, você está fazendo algo errado! 🚀
