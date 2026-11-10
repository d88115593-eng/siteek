# Prime Carpet & Home Care — GitHub e hospedagem

**Repositório publicado:** https://github.com/d88115593-eng/siteek

O projeto já está no GitHub. Não é necessário criar outro repositório nem enviar o ZIP manualmente.

## Hospedar com Docker (servidor VPS)

1. Instale Docker e Docker Compose em um VPS Linux.
2. No servidor, execute:

```bash
git clone https://github.com/d88115593-eng/siteek.git
cd siteek
cp .env.example .env
```

3. Edite o arquivo `.env` no servidor, preenchendo, no mínimo:

- `SITE_URL` — domínio HTTPS real, por exemplo `https://seu-dominio.com`.
- `ADMIN_USERNAME` — nome de usuário do administrador (exemplo: `admin`).
- `ADMIN_PASSWORD` — senha exclusiva e forte (pelo menos 12 caracteres).
- `SESSION_SECRET` — sequência longa e aleatória com pelo menos 32 caracteres.
- `NOTIFY_EMAIL`, `SMTP_*` e `FROM_EMAIL` — opcionais para notificações de novos orçamentos por e-mail.

4. Inicie:

```bash
docker compose up -d --build
```

5. Configure o DNS do domínio e um proxy reverso HTTPS (Caddy/Nginx), apontando para a porta `3001` do serviço. Configure o firewall do servidor. A aplicação precisa de HTTPS para o cookie administrativo seguro.

**Atenção:** GitHub Pages e hospedagens apenas estáticas não são suficientes para este projeto, pois o formulário, o banco de dados e o ADM dependem de um backend Node.js e armazenamento persistente.

## Acesso ao painel ADM

- Website: `https://seu-dominio.com/`
- Administrativo: `https://seu-dominio.com/admin`

A primeira conta é criada no primeiro início usando `ADMIN_USERNAME` / `ADMIN_PASSWORD` do ambiente do servidor. Troque a senha no próprio ADM, se necessário. Nunca coloque credenciais no repositório público.

## SMS — prioridade em Orlando

O site já apresenta **Text Us for a Free Quote** como principal chamada para contato. O número inicial é **+1 (407) 456-6059**, mas deve ser confirmado com o proprietário. O link abre o aplicativo de SMS do visitante e não dispara mensagens automaticamente. Para configurar, entre em `Admin > Contact & SEO > SMS / US phone number`.

O WhatsApp é opcional e só aparece depois que você preencher um número próprio no mesmo painel. Solicitações feitas pelo formulário são salvas em `Admin > Estimate Requests`. Notificações por SMS exigem integração separada com um provedor de mensagens.

## Personalizar o site

No ADM, atualize cores, textos, logo, fotografias reais, serviços gerais, galerias de antes/depois, áreas atendidas, ofertas, avaliações autorizadas, horários, contatos e SEO. A logo original já está no repositório em `public/assets/prime-logo-original.jpg`.

## Segurança e manutenção

- Use HTTPS, senhas fortes e credenciais exclusivas para produção.
- Faça backup do volume Docker `prime_data`, que contém banco SQLite e imagens enviadas.
- Não execute múltiplas réplicas sem migrar banco e armazenamento para serviços compartilhados.
- Revise a Política de Privacidade e os Termos antes de publicar para clientes na Flórida.
- Confirme cidades, ZIP codes, horários e o prazo divulgado de resposta com a equipe.
- Consulte os testes no GitHub em **Actions > Build and smoke tests**.

Para detalhes técnicos adicionais, veja o `README.md` na raiz do repositório.
## Login por usuário e senha (sem e-mail)

A página `/admin` possui campos **Username** e **Password**, sem e-mail. O usuário inicial é lido de `ADMIN_USERNAME` e a senha de `ADMIN_PASSWORD` somente na primeira inicialização com banco vazio. O padrão do nome é `admin` caso `ADMIN_USERNAME` esteja ausente.

Instalações antigas com logins por e-mail são migradas automaticamente: o primeiro proprietário passa a usar **admin**, a senha criptografada é preservada e o acesso aos dados não é perdido. Outros usuários recebem usernames distintos. **Não publique senhas em repositórios GitHub públicos.**

## Ícone no Google e prévia de compartilhamento

No ADM, em **Website & Branding**, configure a logo, o ícone **Google & browser tab icon** e a imagem de compartilhamento. A logo original é a opção inicial. O backend disponibiliza `/favicon.png` e `/social-preview.jpg`, usados no HTML do site. Depois de configurar seu domínio e publicar, o Google poderá atualizar o favicon no próximo rastreamento; a atualização nos resultados não é imediata.

## Vídeos e orçamento via WhatsApp

A seção **Real Results** centraliza as comparações antes/depois. Logo abaixo aparecem os vídeos reais disponíveis e um formulário breve que prepara uma mensagem de orçamento por WhatsApp ou SMS. **A mensagem só é enviada quando o visitante confirma o envio no aplicativo.** Esse formulário rápido não armazena um contato no ADM; para registrar leads, o visitante deve utilizar o formulário completo **Get your free estimate**.
