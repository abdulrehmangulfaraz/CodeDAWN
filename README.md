
# 🌅 CodeDawn — Your Discreet, Context-Aware AI Code Assistant for VS Code

> _The Dawn of Seamless Coding Assistance Begins Here._

## 🔮 Overview

**CodeDawn** is a **minimalist yet powerful AI assistant** for Visual Studio Code — engineered to provide **context-aware code suggestions** and **terminal commands** with a **single keystroke**, no distractions, and no intrusive popups.

Designed for developers who want help without leaving their flow.

## 💡 Philosophy

> “Great tools stay out of your way.”

CodeDawn was built with the belief that AI in the editor should **feel like magic** — invisible yet intelligent. Inspired by the gentle light of dawn that reveals detail without glare, CodeDawn:

-   Understands your **active code context**
    
-   Responds **intuitively** to your commands
    
-   Inserts output **silently and intelligently**
    
-   Feels like a **natural part** of VS Code
    

## ⚙️ Key Features

### 🧠 Context-Aware Intelligence

-   Detects **selected code block**
    
-   Infers **language type** (Python, JS, etc.)
    
-   Sends enriched prompt with context to AI models
    

### 🎛️ Frictionless UI

-   ✅ `Ctrl+L` / `Cmd+L`: Launch code prompt (like the Command Palette)
    
-   ✅ `Ctrl+Shift+L` / `Cmd+Shift+L`: Launch terminal AI assistant
    
-   🔁 Auto-inserts code or terminal command without breaking flow
    

### 🚀 Dual AI Engine Support

-   🔹 **Gemini (1.5 Flash)** by Google _(Preferred if configured)_
    
-   🔸 **Groq (LLaMA3-8B-8192)**  _(Fallback or standalone)_
    

## 🛠️ Installation & Setup

### 1. 📦 Install Extension

-   Open VS Code
    
-   Go to **Extensions** panel `Ctrl+Shift+X`
    
-   Search for `CodeDawn` and install
    

### 2. 🔐 Configure API Keys

-   Go to `File > Preferences > Settings`
    
-   Search for **CodeDawn**
    

#### 🔹 Gemini API Key (Recommended)

-   Get your key from [Google AI Studio](https://aistudio.google.com/app/apikey "null")
    
-   Paste it in `codedawn.geminiApiKey`
    

#### 🔸 Groq API Key (Optional / Fallback)

-   Get your key from [GroqCloud Console](https://console.groq.com/keys "null")
    
-   Paste it in `codedawn.groqApiKey`
    

## 📂 Project Structure

File

Purpose

`extension.js`

🔧 Core logic (commands, context detection, API calls, insertion)

`package.json`

📦 Metadata, commands, keybindings, configuration schema

`.gitignore`

🚫 Version control exclusions

`package-lock.json`

📌 Locked dependencies for consistent installs

## 🔍 Behind the Scenes (Technical Overview)

-   🧠 Prompt logic instructs the AI to classify requests and return structured JSON
    
-   ⚡ Uses `node-fetch` to communicate with AI APIs
    
-   🎯 Reliably distinguishes between _editor code requests_ and _terminal shell prompts_
    
-   🔁 Smart command routing for terminal/code-injection based on AI classification
    

## 📅 Roadmap

### ✅ Phase 0 — Vision & Planning _(Completed)_

-   Philosophy & tool direction finalized
    
-   Feature layout and architecture mapped
    

### ✅ Phase 1 — Core Integration _(Completed)_

-   Hotkey-driven Command Palette interface
    
-   API integration with Gemini & Groq
    
-   Inline code suggestion & editor insertion
    

### ✅ Phase 2 — Terminal Awareness _(Completed)_

-   Dedicated terminal for AI shell command input
    
-   Context-aware routing to terminal/editor
    
-   Enhanced reliability and UX polish
    

### 🛣️ Upcoming Features

-   Multi-file context
    
-   Customizable prompt templates
    
-   AI-assisted debugging
    
-   Support for more AI providers
    

## 🤝 Contributing

We welcome contributions from the community!

See the [CONTRIBUTING.md](./CONTRIBUTING.md) file for details on how to get started.

## 📜 License

CodeDawn is released under the **MIT License**.

See the [LICENSE](./LICENSE) file for details.

## 🌠 Final Words

> “Let AI illuminate your code — not interrupt it.”

**CodeDawn** is designed to be more than a tool — it’s your silent coding partner. Elegant. Intelligent. Invisible.

**Made with 🧠, 👨🏻‍💻, and ❤️ by Abdulrehman**