const vscode = require('vscode');
const fetch = require('node-fetch');

require('dotenv').config({ path: __dirname + '/.env' });

function activate(context) {
    console.log('Congratulations, your extension "CodeDawn" is now active!');

    // Command for Ctrl+L (Input Box)
    const invokeCommand = vscode.commands.registerCommand('codedawn.invoke', async () => {
        const editor = vscode.window.activeTextEditor;
        const selection = editor ? editor.selection : undefined;
        // MODIFIED: Removed placeholder text for a cleaner look
        const userPrompt = await vscode.window.showInputBox({ prompt: ">" });

        if (userPrompt) {
            const target = isShellCommandQuery(userPrompt) ? 'terminal' : 'editor';
            await processRequest(userPrompt, editor, selection, target);
        }
    });
    
    // Command for Ctrl+Shift+L (Terminal Input)
    const openTerminalCommand = vscode.commands.registerCommand('codedawn.openTerminal', () => {
        const pty = new DawnInputTerminal();
        const terminal = vscode.window.createTerminal({ name: 'DAWN Input', pty });
        terminal.show();
    });

    context.subscriptions.push(invokeCommand, openTerminalCommand);
}

// The new, streamlined Pseudoterminal for input only
class DawnInputTerminal {
    constructor() {
        this.writeEmitter = new vscode.EventEmitter();
        this.onDidWrite = this.writeEmitter.event;
        this.closeEmitter = new vscode.EventEmitter();
        this.onDidClose = this.closeEmitter.event;
        this.commandLine = '';
    }

    open() {
        // MODIFIED: Removed all welcome messages for a completely silent terminal
        this.writeEmitter.fire('> ');
    }

    close() {}

    handleInput(data) {
        if (data === '\r') { 
            this.writeEmitter.fire('\r\n');
            const userPrompt = this.commandLine.trim();
            
            if (userPrompt) {
                const editor = vscode.window.activeTextEditor;
                const selection = editor ? editor.selection : undefined;
                const target = isShellCommandQuery(userPrompt) ? 'terminal' : 'editor';
                
                processRequest(userPrompt, editor, selection, target).then(() => {
                    this.closeEmitter.fire();
                });
            } else {
                this.closeEmitter.fire();
            }
            return;
        } 
        
        if (data === '\x7f') { 
            if (this.commandLine.length > 0) {
                this.commandLine = this.commandLine.slice(0, -1);
                this.writeEmitter.fire('\b \b');
            }
            return;
        } 
        
        this.commandLine += data;
        this.writeEmitter.fire(data);
    }
}

// --- Helper Functions ---

function isShellCommandQuery(prompt) {
    const keywords = [ 'git', 'docker', 'npm', 'yarn', 'ls', 'cd', 'mkdir', 'grep', 'find', 'ssh', 'list', 'show', 'files', 'command', 'terminal', 'shell', 'cli' ];
    const lowerCasePrompt = prompt.toLowerCase();
    return keywords.some(keyword => lowerCasePrompt.includes(keyword));
}

function extractCode(text) {
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]+?)\n```/;
    const match = text.match(codeBlockRegex);
    return match ? match[1] : text;
}

async function processRequest(userPrompt, editor, selection, outputTarget) {
    if (outputTarget === 'editor' && !editor) {
        return vscode.window.showInformationMessage('No active editor to write to.');
    }
    
    try {
        // MODIFIED: Removed the withProgress notification wrapper for a silent experience
        await runApiCall(userPrompt, editor, selection, outputTarget);
    } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage('CodeDawn Error: ' + error.message);
    }
}

async function runApiCall(userPrompt, editor, selection, outputTarget) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not found in .env file.");

    const modelName = "gemini-1.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const fileLanguage = editor ? editor.document.languageId : 'text';

    let fullPrompt = userPrompt;
    if (selection && !selection.isEmpty && editor) {
        const selectedText = editor.document.getText(selection);
        fullPrompt = `${userPrompt}:\n\n\`\`\`\n${selectedText}\n\`\`\``;
    }

    const systemPrompt = `You are a VS Code AI assistant. Your response must be only the code itself, with no explanation or markdown formatting. The user is currently in a file of type '${fileLanguage}'. Fulfill the following request: ${fullPrompt}`;

    const payload = { contents: [{ parts: [{ text: systemPrompt }] }] };

    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    if (!result.candidates || !result.candidates.length) {
        throw new Error("API returned no candidates.");
    }
    
    const rawText = result.candidates[0].content.parts[0].text;
    const generatedText = extractCode(rawText).trim();

    if (outputTarget === 'terminal') {
        let terminal = vscode.window.terminals.find(t => t.name !== 'DAWN Input');
        if (!terminal) { terminal = vscode.window.createTerminal(); }
        terminal.show();
        terminal.sendText(generatedText, false);
    } else {
        editor.edit(editBuilder => {
            editBuilder.replace(selection, generatedText);
        });
    }

    // MODIFIED: Removed the final success message
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};