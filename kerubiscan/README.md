# Kerubi Vulnerability Scanner (KVS) - Frontend

This is the Next.js web application interface for the Kerubi Vulnerability Scanner, designed for security operators and administrators to manage vulnerability scans, view insights, and generate reports.

## Overview
The Kerubiscan frontend is built with **Next.js**, utilizing the App Router and modern React features. It connects to the KVS backend (/api/v1) through an internal proxy to securely fetch data, trigger scans, and fetch AI insights.

## Core Features
- **Dashboard & Analytics**: Real-time overview of scanning activities, vulnerability distributions, and high-risk assets.
- **Scan Management**: Launch on-demand multi-engine security audits or schedule recurring scans.
- **Reporting (PDF & HTML)**: Download comprehensive audit reports complete with CVSS scoring, AI Executive Summaries, and specific asset remediation steps. 
- **Policy Management**: Easily Create, Read, Update, and Delete (CRUD) scanning and compliance policies right from the interface.
- **Internationalization (i18n)**: Out-of-the-box multilingual support (e.g., English and French interfaces).
- **Authentication**: Fully integrated with Keycloak for enterprise-grade Single Sign-On (SSO) and role-based access control.

## Recent Updates
- Added comprehensive Edit and Delete functionalities to the Policies management page.
- Fixed UI translation bugs where characters like "é" in "Opérationnel" were improperly encoded as UTF-8 mojibake.
- Upgraded the "Download PDF" capability in the Reports section to properly consume the backend's new multi-asset Scan PDF generation endpoints.

## Getting Started Locally

First, install dependencies:
``bash
npm install
``

Then, run the development server:
``bash
npm run dev
``
Open [http://localhost:3000](http://localhost:3000) with your browser. Note: ensure the KVS backend is running and that your .env variables point to the correct BACKEND_API_URL and Keycloak endpoints.
