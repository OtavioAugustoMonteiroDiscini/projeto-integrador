# Sistema de Gestão Empresarial

Um sistema completo de gestão empresarial desenvolvido com React, Node.js, Express e Prisma.

## 🚀 Funcionalidades

- **Autenticação de Empresas**: Login e cadastro com dados separados por empresa
- **Gestão de Produtos**: Cadastro, edição e controle de estoque
- **Sistema de Vendas**: Registro de vendas com controle de estoque automático
- **Sistema de Compras**: Registro de compras com atualização de estoque
- **Contas a Pagar e Receber**: Controle financeiro completo
- **Alertas Inteligentes**: Notificações de estoque baixo e vencimentos
- **Dashboard de BI**: Gráficos e relatórios em tempo real
- **Interface Moderna**: Design responsivo com Tailwind CSS

## 🛠️ Tecnologias

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT para autenticação
- Bcrypt para hash de senhas

### Frontend
- React 18
- React Router
- React Query
- Tailwind CSS
- Recharts (gráficos)
- Lucide React (ícones)

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- PostgreSQL (versão 12 ou superior)
- npm ou yarn

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd sistema-gestao-empresarial
```

### 2. Configure o Backend

```bash
cd backend
npm install
```

### 3. Configure o Banco de Dados

1. Crie um banco PostgreSQL:
```sql
CREATE DATABASE sistema_gestao;
```

2. Configure as variáveis de ambiente:
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sistema_gestao?schema=public"
JWT_SECRET="seu_jwt_secret_muito_seguro_aqui_2024"
PORT=3001
```

### 4. Execute as Migrações

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Popule o banco com dados de exemplo (opcional)

```bash
npm run db:seed
```

### 6. Configure o Frontend

```bash
cd ../frontend
npm install
```

### 7. Inicie os Serviços

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

## 🌐 Acesso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Prisma Studio**: `npx prisma studio` (no diretório backend)

## 👤 Dados de Teste

Após executar o seed, você pode usar:

- **Email**: empresa@exemplo.com
- **Senha**: 123456

## 📊 Funcionalidades Principais

### Dashboard
- Resumo financeiro do mês
- Gráficos de vendas por período
- Produtos mais vendidos
- Vendas por forma de pagamento
- Alertas de estoque baixo

### Gestão de Produtos
- Cadastro completo de produtos
- Controle de estoque automático
- Alertas de estoque baixo
- Categorização e marcação

### Sistema de Vendas
- Registro de vendas com múltiplos produtos
- Controle automático de estoque
- Diferentes formas de pagamento
- Relatórios de vendas

### Sistema de Compras
- Registro de compras de fornecedores
- Atualização automática de estoque
- Controle de preços de custo
- Relatórios de compras

### Contas a Pagar/Receber
- Controle de vencimentos
- Alertas de contas vencidas
- Categorização de contas
- Relatórios financeiros

## 🔒 Segurança

- Autenticação JWT
- Senhas criptografadas com bcrypt
- Validação de dados no backend
- Rate limiting
- CORS configurado
- Headers de segurança

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop
- Tablet
- Mobile

## 🚀 Deploy

### Backend (Heroku/Railway/DigitalOcean)
1. Configure as variáveis de ambiente
2. Execute as migrações
3. Inicie o servidor

### Frontend (Vercel/Netlify)
1. Configure a variável `REACT_APP_API_URL`
2. Faça o build: `npm run build`
3. Deploy do build

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Para suporte, entre em contato através dos issues do GitHub.

---

Desenvolvido com ❤️ para facilitar a gestão empresarial.
