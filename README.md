# Greenscape Designz - Landscape Intelligence System (V4)

This repository contains the RIBA Stage 0-1 Landscape Intelligence Capture System for Greenscape Designz. It replaces standard client onboarding forms with an adaptive, behavioral-mapping web application that dynamically generates design personas and PDF briefs.

## Architecture
This system is composed of two main layers:
1. **Frontend (`index.html`)**: A premium, mobile-optimized HTML/JS interface utilizing IntersectionObserver for progress tracking, localStorage for draft saving, and Base64 encoding for file payloads.
2. **Backend (`Code.gs`)**: A Google Apps Script backend operating as a RESTful endpoint. It handles database routing to Google Sheets, dynamic folder creation in Google Drive, PDF document synthesis, and automated email dispatching.

## Features
* **Dynamic Behavioral Branching**: UI adapts based on user inputs (e.g., revealing mobility inputs only if elderly residents are selected).
* **Persona Generation Engine**: Analyzes wellness vs. luxury inputs to categorize the project (e.g., "The Ecological Wellness Sanctuary").
* **Automated PDF Synthesis**: Converts the collected data into a formatted RIBA Stage 0-1 PDF Brief.
* **Intelligent File Storage**: Automatically creates nested Google Drive folders labeled with generated Project IDs (e.g., `GDZ-2026-4832 - Client Name`).
* **Strict Payload Security**: Includes a `SECURITY_TOKEN` verification step and strict 5MB frontend validation to prevent payload limit crashes.
* **Draft Auto-Save**: Prevents data loss during long onboarding sessions via `localStorage`.

## Deployment Instructions

### 1. Backend (Google Apps Script)
1. Go to [script.google.com](https://script.google.com/) and create a new project.
2. Paste the contents of `Code.gs` into the editor.
3. Select the `setupDatabase` function from the top toolbar dropdown and click **Run**. Grant necessary permissions.
4. Click **Deploy** > **New deployment**.
5. Select **Web app**. Set *Execute as* to "Me" and *Who has access* to "Anyone".
6. Copy the resulting Web App URL.

### 2. Frontend (HTML)
1. Open `index.html`.
2. Locate the line: `const SCRIPT_URL = '...';`
3. Ensure the URL matches your active Apps Script deployment URL.
4. Host `index.html` on your preferred static hosting provider (GitHub Pages, Netlify, Vercel, or embed directly into your WordPress/Webflow site).

## Version Notes (V4)
* Integrated strict file size controls (5MB limit).
* Implemented chip state saving to local storage.
* Added live range slider values.
* Added Regex email validation.
* Integrated the PDF Brief synthesis and automated emailing.
