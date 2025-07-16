
# Project Plan: CodeDawn

> A discreet, powerful, and context-aware AI code assistant for Visual Studio Code. The core philosophy is to provide powerful AI assistance without breaking the user's workflow or drawing unwanted attention.

### 💡 Core Vision & Philosophy

The name **CodeDawn** reflects the core purpose of the tool. Just as dawn brings light to the darkness, this extension brings the clarity and illumination of AI to the often complex, "dark themes" of coding. It represents a new beginning for a piece of code, transforming it into something better and more understandable.

Our goal is to create a **frictionless and invisible** AI coding assistant that feels like a native part of VS Code. The tool must understand the user's context, accept natural language prompts through subtle interfaces, and deliver results instantly without announcing its presence. **Discretion is a primary design goal.**

### 🚀 Core Features

-   **Discreet Interface**: No flashy popups or dialogs. CodeDawn is invoked via a keypress (`Ctrl+L`) and uses a prompt that mimics the native VS Code Command Palette.
    
-   **Context-Aware**: CodeDawn automatically reads your currently selected code and active file language to provide highly relevant and accurate suggestions.
    
-   **Seamless Code Insertion**: Generated code is instantly and silently inserted into your editor, either replacing your selection or appearing at your cursor.
    
-   **Intelligent Terminal Integration**: Run CodeDawn from the integrated terminal for ultimate discretion. It's smart enough to know whether you're asking for a shell command or for code to be written to your active file.
    

### 🧑‍💻 User Workflow Scenarios

#### Scenario A: Code Generation

1.  A developer is in `main.py`. They press **`Ctrl+L`**.
    
2.  A prompt appears: `> CodeDawn:`
    
3.  They type `create a class for a user with name and id` and press **Enter**.
    
4.  # The Python class code appears instantly in `main.py`.
    

#### Scenario B: Refactoring with Discretion

1.  A developer has a messy function highlighted in `utils.js`.
    
2.  They switch focus to the integrated terminal and type: `codedawn refactor this to use arrow functions and make it async` and press **Enter**.
    
3.  The messy function in `utils.js` is instantly replaced with the clean, refactored version. No popups, no new windows.
    

#### Scenario C: Getting a Shell Command

1.  In the terminal, a developer types: `codedawn git command to see all commits from last week` and presses **Enter**.
    
2.  The command `git log --since="1 week ago"` is printed directly into their terminal, ready to run.
    

### 🗺️ Project Roadmap & Timeline

This project is estimated to take between **18 - 28 hours** to complete.

#### Phase 0: Planning & Foundation (Complete)

-   [x] Define project vision, philosophy, and core features.
    
-   [x] Choose a final name and branding concept.
    
-   [x] Outline user workflows and technical stack.
    
-   [x] Create official project documentation (`README.md`, Project Plan).
    

#### Phase 1: Core Editor Integration (MVP)

-   [ ] Implement the `Ctrl+L` keybinding and discreet command prompt.
    
-   [ ] Develop context-aware logic to handle selected text vs. no selection.
    
-   [ ] Integrate with the Gemini API for code generation and transformation.
    
-   [ ] Implement seamless code insertion into the active editor.
    
-   [ ] Add robust error handling and user feedback notifications.
    

#### Phase 2: Intelligent Terminal Integration

-   [ ] Implement the `codedawn` terminal command.
    
-   [ ] Develop the intelligent routing logic to differentiate between code requests and shell command requests.
    
-   [ ] Ensure the terminal command can access the context of the active editor file.
    
-   [ ] Test and refine all terminal-based workflows.
    

### 🛠️ Technical Stack

-   **Language:** JavaScript
    
-   **Framework:** VS Code Extensibility API / Node.js
    
-   **API Service:** Gemini API
    
-   **Dependencies:**  `node-fetch` for API communication