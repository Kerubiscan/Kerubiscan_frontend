# Kerubi Vulnerability Scanner (KVS) - Frontend

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

The **Kerubi Vulnerability Scanner (KVS)** frontend is a modern, responsive, and highly interactive web application designed to give security analysts full visibility and control over their vulnerability management workflows.

Built with **Next.js (App Router)** and **Tailwind CSS**, it acts as the primary interface for managing scans, visualizing threats, generating AI-powered insights, and administrating security policies.

## 🌟 Core Features

- **Dynamic Dashboard & KPI Visualization**: Real-time visualization of scanner status (OpenVAS, Nuclei, Nmap) and vulnerability metrics using responsive charts and data grids.
- **Scan & Asset Management**: Initiate, schedule, and track discovery and vulnerability scans across multiple network assets and subnets.
- **Deep Vulnerability Insights**: Interactive data tables mapping identified CVEs, CVSS scores, and threat intelligence. Includes contextual AI-driven remediation steps and business impact analysis.
- **Advanced Reporting**: Instantly generate and export highly polished, localized HTML and PDF executive summaries directly from the UI.
- **Policy & Secret Configuration**: Full UI support for configuring scan policies and credential secrets (Create, Read, Update, Delete) securely synced with the backend Vault.
- **Internationalization (i18n)**: Fully localized interface supporting multiple languages (English, French, etc.) via `next-intl`.
- **Authentication**: Integrated with Keycloak and NextAuth for secure, role-based access control.

## 📁 Project Structure

```text
kerubiscan/
├── app/
│   └── [locale]/               # Next.js App Router with i18n support
│       ├── (auth)/             # Login and authentication routes
│       └── dashboard/          # Main application interface (Scans, Assets, Reports, Policies)
├── components/                 # Reusable UI components
│   ├── layout/                 # Sidebar, Header, Navigation
│   └── ui/                     # Buttons, Modals, DataTables, Charts
├── lib/                        # Utilities, API wrappers (fetchApi), and hooks
├── messages/                   # Translation JSON files (en.json, fr.json)
└── public/                     # Static assets, branding, and images
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+)
- Docker (for full stack deployment)

### Environment Variables
The application relies on several environment variables defined in `.env`:
```env
BACKEND_API_URL=http://localhost:9445
NEXTAUTH_URL=http://localhost:9443
KEYCLOAK_CLIENT_ID=KVS-web
KEYCLOAK_REALM=kimia
```

### Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:9443` in your browser.

*Note: In production environments, the frontend is served via a standalone Next.js Docker container which proxies `/api/v1` traffic to the backend API.*

## 🎨 UI/UX Design

The application utilizes the **KERIBU SOC** dark/light color palette, leveraging `lucide-react` for iconography and custom Tailwind tokens for a seamless, premium security-focused aesthetic.
