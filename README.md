# 🤖 AlasChat - AI Image Analysis with Voice Input

> 🚀 A modern chat application that analyzes your images using AI and supports voice-to-text input!

![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🌟 What is AlasChat?

AlasChat is an intelligent chat application where you can:
- 📸 **Upload images** and ask questions about them
- 🗣️ **Use your voice** to ask questions (works on mobile too!)
- 🤖 **Get AI-powered answers** from Google Gemini and OpenAI
- 💾 **Save your conversations** for later
- 📱 **Use on any device** - desktop, tablet, or mobile

## ✨ Features

- 🖼️ **Smart Image Analysis** - Upload photos and get detailed AI insights
- 🎤 **Voice-to-Text** - Speak your questions instead of typing
- 📱 **Mobile Optimized** - Perfect voice recognition on smartphones
- 💬 **Chat History** - All your conversations are saved
- 🔐 **Secure Login** - Safe authentication with Clerk
- 🌙 **Dark Mode** - Easy on the eyes
- 🌍 **Works Everywhere** - Chrome, Edge, Safari supported

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: Clerk
- **Database**: Firebase Firestore
- **AI**: Google Generative AI + OpenAI
- **Icons**: Lucide React

## 🚀 Quick Start

### 📋 Prerequisites

Before you start, make sure you have:
- 📦 **Node.js 18+** installed ([Download here](https://nodejs.org/))
- 🔑 **Firebase account** ([Sign up here](https://firebase.google.com/))
- 🔐 **Clerk account** ([Sign up here](https://clerk.com/))
- 🤖 **Google AI Studio API key** ([Get here](https://makersuite.google.com/))

### 📥 Installation

1. **Clone this repository**
   ```bash
   git clone https://github.com/yourusername/alaschat.git
   cd alaschat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Fill in your environment variables** (see [Environment Setup](#environment-setup) below)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser** and go to [http://localhost:3000](http://localhost:3000) 🎉

## 🔧 Environment Setup

Create a `.env.local` file in your project root and add these variables:

### 🔐 Clerk Authentication
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 🔥 Firebase Configuration
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 🤖 AI API Keys
```bash
GOOGLE_AI_API_KEY=your_google_ai_key
```

## 📚 How to Get API Keys

### 🔐 Clerk Setup
1. Go to [clerk.com](https://clerk.com/) and create an account
2. Create a new application
3. Copy your **Publishable Key** and **Secret Key** from the dashboard
4. Add your domain to allowed origins

### 🔥 Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database**
4. Go to Project Settings → General
5. Copy your config values from the Firebase SDK snippet

### 🤖 Google AI Studio
1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Create an API key
3. Copy the key to your environment variables

### 🤖 OpenAI (Optional)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add credits to your account
4. Copy the key to your environment variables

## 🎮 Available Scripts

```bash
# 🚀 Start development server with Turbopack (super fast!)
npm run dev

# 🏗️ Build for production
npm run build

# ▶️ Start production server
npm start

# 🧹 Check and fix code issues
npm run lint
```

## 🎤 Voice Features

### 🌐 Browser Support
- ✅ **Chrome** - Full support
- ✅ **Edge** - Full support with optimizations
- ✅ **Safari** - Full support on iOS/macOS
- ❌ **Firefox** - Not supported (shows helpful message)

### 📱 Mobile Tips
- 🎯 Speak clearly and wait for complete phrases
- 🔄 Voice recognition auto-restarts on mobile
- 🚫 Make sure microphone permissions are granted
- 📶 Good internet connection helps accuracy

## 🚀 Deployment

### Vercel (Easiest)
1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com/)
3. Add all environment variables in Vercel dashboard
4. Deploy! 🎉

### Other Options
- **Netlify** - Great for static hosting
- **AWS** - For enterprise deployments
- **Self-hosted** - Using PM2 or Docker

## 🔧 Troubleshooting

### 🎤 Voice Not Working?
- ✅ Use Chrome, Edge, or Safari (not Firefox)
- 🔒 Make sure you're on HTTPS (required for voice)
- 🎯 Allow microphone permissions when prompted
- 📱 On mobile: speak clearly and wait for the full phrase

### 🔥 Firebase Issues?
- 🔑 Double-check all Firebase environment variables
- 🛡️ Make sure Firestore security rules allow your users
- 🌐 Check if Firebase services are accessible

### 🔐 Login Problems?
- 🔑 Verify Clerk keys are correct
- 🌐 Add your domain to Clerk's allowed origins
- 🧹 Clear browser cookies and try again

### 🤖 AI Not Responding?
- 🔑 Check if your API keys are valid and active
- 📊 Verify you haven't hit rate limits
- 💳 Make sure your accounts have sufficient credits

## 🤝 Contributing

We love contributions! Here's how you can help:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔀 Open a Pull Request

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

---

**Made with ❤️ by Sankalp Singh 😁**

*Happy chatting! 🤖💬*
