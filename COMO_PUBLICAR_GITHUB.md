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
- `ADMIN_EMAIL` — e-mail de login do dono.
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

A primeira conta é criada no primeiro início usando `ADMIN_EMAIL` / `ADMIN_PASSWORD` do ambiente do servidor. Troque a senha no próprio ADM, se necessário. Nunca coloque credenciais no repositório público.

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