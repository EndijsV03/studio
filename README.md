# CardSync Pro - Business Card Management App

A professional business card management application built with Next.js, Firebase, and AI-powered text extraction.

## Features

- 📸 AI-powered business card scanning and text extraction
- 🎙️ Voice memo attachments for contacts
- 📊 Export contacts to CSV/XLSX
- 🔐 Firebase authentication (Google, Microsoft, Email/Password)
- 💳 Stripe integration for billing
- 📱 Responsive design

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in your actual values:

```bash
cp .env.example .env.local
```

You'll need to configure:

**Firebase Admin SDK:**
- Go to [Firebase Console](https://console.firebase.google.com)
- Navigate to Project Settings → Service Accounts
- Generate a new private key
- Copy the values to your `.env.local` file

**Stripe (for billing):**
- Get your API keys from [Stripe Dashboard](https://dashboard.stripe.com)

**Gemini AI (for business card extraction):**
- Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:9002`

## Project Structure

- `src/app/` - Next.js app router pages and API routes
- `src/components/` - Reusable UI components
- `src/lib/` - Utility functions and configurations
- `src/ai/` - AI-powered features using Genkit
- `src/types/` - TypeScript type definitions
