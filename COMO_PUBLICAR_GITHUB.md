# Como colocar a Prime Carpet & Home Care no GitHub

O projeto já está estruturado como repositório Git. Você precisa criar um repositório vazio na sua própria conta GitHub e conectá-lo ao projeto.

## 1. Criar o repositório vazio

Abra **https://github.com/new** e use:

- Proprietário: `d88115593-eng` (a conta conectada ao ChatGPT)
- Nome: `prime-carpet-home-care`
- Visibilidade: **Private** (recomendado)
- **Não marque** as opções de criar README, `.gitignore` ou licença (esses arquivos já estão neste projeto).

Clique em **Create repository**.

## 2. Subir o código pelo terminal

Extraia o ZIP e abra o terminal na pasta `prime-carpet-home-care`. Se você estiver usando o pacote ZIP que contém a pasta `.git`, execute:

```bash
git remote add origin https://github.com/d88115593-eng/prime-carpet-home-care.git
git branch -M main
git push -u origin main
```

No Windows, o Git pode abrir a autenticação do navegador. Se o repositório estiver em outra conta, substitua o proprietário na URL.

Se o ZIP não incluir `.git` após a extração, inicie um repositório local:

```bash
git init -b main
git add .
git commit -m "Initial Prime Carpet website and admin dashboard"
git remote add origin https://github.com/d88115593-eng/prime-carpet-home-care.git
git push -u origin main
```

## 3. Hospedar o site

**GitHub armazena o código-fonte, mas não hospeda este painel administrativo completo.** Escolha um VPS/host Node.js com armazenamento persistente ou Docker. O `README.md` tem os comandos de instalação e as variáveis `.env`.

A configuração de domínio, HTTPS e credenciais deve ser feita na hospedagem. Não envie a senha administrativa no repositório.

## 4. Acessar o ADM

Depois da implantação:

- Site: `https://seu-dominio.com/`
- Painel administrativo: `https://seu-dominio.com/admin`

O e-mail/senha de primeiro acesso são aqueles que **você configurar** em `ADMIN_EMAIL` e `ADMIN_PASSWORD` na hospedagem. O projeto não contém senha real nem credenciais prontas.

## 5. SMS e WhatsApp

Entre em **Admin > Contact & SEO** e preencha os números. O WhatsApp foi deixado vazio por segurança até a confirmação do número real. O SMS já vem com o telefone comercial encontrado no cadastro público, mas confirme com o proprietário antes de publicar.