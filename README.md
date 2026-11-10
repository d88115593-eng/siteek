# Prime Carpet & Home Care — Orlando, Florida 🇺🇸

A polished, fully editable English-language website for **Prime Carpet & Home Care**, including a private admin dashboard and lead-management system. Built with React + Vite + Node.js/Express + SQLite.

> **Brand fidelity:** The source includes a crop of the original Prime logo and branded reference posts supplied by the owner, without changing the logo design or colors. Replace example service photos with verified job photos through Admin as new photos become available.

## Included features

- Responsive website with original blue / silver / white visual identity
- Editable hero, navigation, colors, logo, buttons, descriptions, headings, footer and legal copy
- Unlimited service items, including **Other / General Home Services**
- Interactive Before & After comparison gallery
- Photo-based quote form with up to 3 attachments per lead
- One-tap **SMS**, telephone and optional **WhatsApp** links; update numbers from Admin
- Lead dashboard: status, notes, scheduling, contact details, private customer photos
- Appointment calendar showing scheduled estimate requests
- Team accounts with **Owner** and **Editor** roles
- Uploaded image library with safe deletion checks
- Add/edit/delete/reorder/hide services, gallery projects, FAQs, offers, testimonials, service areas
- Page section ordering and visibility controls
- SEO title/description, Open Graph metadata, structured LocalBusiness JSON-LD, sitemap and robots.txt
- Optional Google Analytics and Meta Pixel IDs, loaded only after user opt-in
- Optional email notifications through your SMTP provider
- CSV export of leads, JSON content export
- Private admin login, password hashing, signed HttpOnly cookies and CSRF checks
- Docker support and persistent SQLite/images folder

## Important: hosting requirements

This is a **full-stack application**, not a static HTML website. It runs on any hosting provider that supports **Node.js 20+ with persistent disk storage**, or a Linux VPS with Docker. Examples include your own VPS, Hostinger VPS, Railway with a volume, Render with a persistent disk, and other equivalent platforms.

It **cannot** work as a complete admin-enabled site on static-only hosts (like GitHub Pages) because the database and backend endpoints require a server. Serverless deployments without persistent storage require a separate database and object-storage adaptation. GitHub is where you keep the source, **not** where this backend is hosted.

## Run locally

1. Install **Node.js 22** (or at least Node 20).
2. Copy `.env.example` to `.env`.
3. Set your own `ADMIN_USERNAME` (or use the default `admin`), a long `ADMIN_PASSWORD` (at least 12 characters), and a random `SESSION_SECRET` (at least 32 characters).
4. Keep `NODE_ENV=development` when running locally over HTTP.
5. Install dependencies and run:

```bash
npm install
npm run dev
```

Open **http://localhost:5173** for the website and **http://localhost:5173/admin** to sign in.

The API runs on port 3001. Vite proxies `/api` and `/uploads` to the backend. Once the server starts, you can run `npm run smoke` to check public endpoints and access control.

The **first admin account is created only once**, during the first server startup, from `ADMIN_USERNAME` / `ADMIN_PASSWORD`. After that, update credentials from **Account & Security** in the Admin dashboard. Changes to the initial `.env` admin values will not overwrite an existing account.

## Production deployment with Docker (recommended)

On a VPS with Docker and Docker Compose:

```bash
cp .env.example .env
# Edit .env: set SITE_URL, ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET
# Use the correct production domain, for example https://primecarpethome.com
docker compose up -d --build
```

The provided `docker-compose.yml` forces `NODE_ENV=production` and exposes port `3001` on the host. Configure a reverse proxy such as Caddy, Nginx or Traefik with **HTTPS** for your domain; forward incoming HTTPS traffic to `localhost:3001`.

**Make sure the proxy forwards HTTPS correctly**, because production admin session cookies require HTTPS (`secure: true`).

If you use `TRUST_PROXY=1`, only do so when your app is truly behind a trusted reverse proxy. A separate DNS and SSL configuration is required at your hosting provider.

**Persistent data:** Docker Compose creates volume `prime_data` mounted at `/app/data`. Do not delete that volume during updates. It holds the database and uploaded images.

### Node deployment without Docker

```bash
npm install
npm run build
NODE_ENV=production npm start
```

Set `PORT`, `SITE_URL`, `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` and a writable persistent `DATA_DIR` in your hosting provider's environment settings. On Windows, set environment variables in the host settings instead of using the Unix-style command prefix.

## Recommended .env production settings

| Key | Purpose |
| --- | --- |
| `PORT` | App listening port, default 3001 |
| `NODE_ENV` | `production` in public hosting |
| `SITE_URL` | Public `https://…` URL for sitemap and metadata |
| `SESSION_SECRET` | Random secret, 32+ characters |
| `ADMIN_USERNAME` | Initial admin username (used only if the database has no admins) |
| `ADMIN_PASSWORD` | Initial admin password, 12+ characters |
| `DATA_DIR` | Persistent location for the SQLite DB and uploads, default `./data` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` | Optional SMTP mail server |
| `NOTIFY_EMAIL`, `FROM_EMAIL` | Optional addresses for new-lead notifications |
| `TRUST_PROXY` | Set `1` only behind a properly configured, trusted reverse proxy |

### Request notifications

Submitted quote requests are **always recorded in the dashboard**, even if SMTP isn't configured. When SMTP variables are provided, the site also sends a **notification email** to the business. Outbound **SMS or WhatsApp automation is NOT included**: SMS and WhatsApp buttons open the customer's messaging app. Automated messaging requires an approved SMS/WhatsApp provider and additional setup.

### Edit content via /admin

- **Website & Branding:** all major labels, headlines, colors, logo and images
- **Page Builder:** display/hide/reorder the homepage's main sections
- **Services:** create as many services as needed, no hard-coded prices
- **Before & After:** upload separate real before/after photos and add descriptions
- **Customer Reviews:** publish genuine, authorized reviews
- **FAQs / Service Areas / Offers:** full CRUD; set dates for promotions and optional service price labels
- **Contact & SEO:** edit SMS number, WhatsApp number, public email, Instagram, Facebook, SEO, privacy policy and terms
- **Estimate Requests:** update each lead's status, follow-up notes and appointment date/time
- **Appointments:** calendar view of scheduled requests
- **Media Library:** review uploads, copy URLs, remove unused images
- **Team Access:** owner can add/edit access to team accounts
- **Account & Security:** change your own admin username/password

### Initial business information

- Business: Prime Carpet & Home Care
- Service area: Orlando, Florida and nearby areas (confirm exact ZIP codes)
- SMS / phone: **(407) 456-6059**, verified from the public business listing; confirm with the owner before publishing
- Instagram: https://www.instagram.com/primecarpethome/
- WhatsApp is **initially blank**, so its button is hidden until you enter the correct number in Admin.
- Typical response time message is editable; it is not an automated reply guarantee.
- No unverified reviews, fabricated prices, or offers are preloaded.

## Backups

Download **Export JSON** and **Export CSV** from the dashboard for content and lead records. The JSON export does **not** contain the physical uploaded image files. For a **complete** backup, save the entire persistent `data/` directory or the Docker volume, including `prime.db` and `uploads/`. Store customer information and photos securely. Restoring a full backup means replacing that directory or volume when the application is stopped.

## GitHub

This is a complete source project you can commit to a new GitHub repository. Do **not** commit `.env`, database files, uploaded customer photos, or `node_modules`.

The root folder is already structured for a repository. See [`COMO_PUBLICAR_GITHUB.md`](./COMO_PUBLICAR_GITHUB.md) for exact instructions in Portuguese.

## Before using the site publicly

1. Verify phone, WhatsApp and service areas with the business owner.
2. Customize the Privacy Policy and Terms for your business and applicable US/Florida laws; the included text is a starting point, **not legal advice**.
3. Set up a secure HTTPS domain and strong admin credentials.
4. Test a real estimate request and check the admin inbox.
5. Configure SMTP if you want emails about new leads.
6. Replace any initial promotional art with current, permission-cleared real project photos as appropriate.
7. Ensure any stated response times reflect actual staffing and hours.

## License & content

This project was prepared for the owner of Prime Carpet & Home Care. Brand assets and business photographs are provided by the user. Do not reuse their logo or images for unrelated businesses without the owner's consent.

## Orlando / SMS-first configuration

- The primary call to action is **Text Us for a Free Quote** and opens the user's SMS app using the United States phone number in Admin → Contact & SEO.
- The initial business contact is **+1 (407) 456-6059**. Confirm ownership and SMS deliverability with the business owner before public launch.
- WhatsApp is optional and hidden unless explicitly configured.
- The online estimate form stores requests securely in the admin dashboard; no SMS messages are sent automatically without an additional SMS provider.
- The response-time caption is editable and indicates a typical time, **not** a guaranteed SLA.
- Do not publish unverified service-area cities or ZIP codes. Orlando is the primary listed market; confirm each suburb and range with the owner.

## Job videos and SMS / WhatsApp for Orlando

- The **Job Videos** admin section can upload MP4/WebM files (40 MB limit per file, possibly lower at your hosting proxy), edit descriptions, choose cover photos, reorder and hide videos. Uploaded media lives in the **persistent** `DATA_DIR/uploads/public` folder.
- **SMS is the primary customer action**. The floating WhatsApp shortcut appears if a WhatsApp number is filled in **Admin → Contact & SEO**. Confirm that `4074566059` supports WhatsApp before publishing. Remove the number to hide the icon.
- Six source work videos were supplied and prepared as compressed MP4 clips in the separate downloadable project bundle. They **are not yet part of the GitHub source-only checkout**; after deployment, upload each via **Admin → Job Videos**, or copy files to `public/assets/` before building. Until present, their website cards are hidden.
- No public service price is inferred from the footage. Configure prices or offers in the admin only after confirming US-dollar pricing with the business owner.

### Admin sign-in and upgrades

- Use **Username + Password**, never email, at `/admin`.
- First install: set `ADMIN_USERNAME` (defaults to `eike`) and secret `ADMIN_PASSWORD` of 12+ characters. Do not commit passwords to this repository.
- When upgrading from the older email-login version, the SQLite DB automatically preserves existing administrator IDs and bcrypt password hashes while migrating to usernames; the first owner gets `eike`. After logging in, use **Account & Security** to change the username or password.
- Team accounts also use usernames without email.

### Real Results, videos and WhatsApp

The before-and-after examples are centered. Real job videos (if uploaded) display directly below. The new quick form collects name, callback number, ZIP, selected service and project description and opens a prefilled WhatsApp message (SMS alternative). The visitor must press Send in their messaging app; the quick form does **not** store requests in the website database. For a lead that appears in the ADM, use the full website estimate form.

### Original Prime logo in browser and Google

The admin's **Website & Branding** panel contains an editable favicon and social preview image. The backend serves `/favicon.png` (96×96 PNG from the unchanged original logo) and `/social-preview.jpg` (1200×630 sharing canvas). Google decides when a favicon appears in search results, after indexing the production HTTPS domain.
