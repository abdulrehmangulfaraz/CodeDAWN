const vscode = require('vscode');
const fetch = require('node-fetch');

require('dotenv').config({ path: __dirname + '/.env' });

function activate(context) {
    console.log('Congratulations, your extension "CodeDawn" is now active!');

    // The single, intelligent command for Ctrl+L
    const invokeCommand = vscode.commands.registerCommand('codedawn.invoke', async () => {
        const editor = vscode.window.activeTextEditor;
        const selection = editor ? editor.selection : undefined;
        
        const userPrompt = await vscode.window.showInputBox({ prompt: "CodeDawn" });

        if (userPrompt) {
            const target = isShellCommandQuery(userPrompt) ? 'terminal' : 'editor';
            await processRequest(userPrompt, editor, selection, target);
        }
    });

    // The command to open our custom proxy terminal
    const openTerminalCommand = vscode.commands.registerCommand('codedawn.openTerminal', () => {
        const pty = new DawnTerminal();
        const terminal = vscode.window.createTerminal({ name: 'DAWN', pty });
        terminal.show();
    });

    context.subscriptions.push(invokeCommand, openTerminalCommand);
}

// --- The Advanced Pseudoterminal Implementation ---
class DawnTerminal {
    constructor() {
        this.writeEmitter = new vscode.EventEmitter();
        this.onDidWrite = this.writeEmitter.event;
        this.commandLine = '';
    }

    open() {
        this.writeEmitter.fire('Welcome to the DAWN Terminal.\r\n');
        this.writeEmitter.fire('Type `dawn <your prompt>` and press Enter.\r\n\r\n');
        this.writeEmitter.fire('$ ');
    }

    close() {}

    handleInput(data) {
        if (data === '\r') { // User pressed Enter
            this.writeEmitter.fire('\r\n');
            
            // Parse the command
            if (this.commandLine.trim().startsWith('dawn ')) {
                const userPrompt = this.commandLine.replace('dawn ', '').trim();
                const editor = vscode.window.activeTextEditor;
                const selection = editor ? editor.selection : undefined;

                // Process the request and write output back to this terminal
                processRequest(userPrompt, editor, selection, 'terminal', this.writeEmitter);
            } else if (this.commandLine.trim() !== '') {
                this.writeEmitter.fire(`Unknown command: "${this.commandLine.trim()}". Please use the format: dawn <prompt>\r\n`);
            }
            
            this.commandLine = ''; // Reset for next command
            this.writeEmitter.fire('$ '); // Show the prompt again
        } else if (data === '\x7f') { // User pressed Backspace
            if (this.commandLine.length > 0) {
                this.commandLine = this.commandLine.slice(0, -1);
                this.writeEmitter.fire('\b \b'); // Move cursor back, write space, move back again
            }
        } else {
            this.commandLine += data;
            this.writeEmitter.fire(data); // Echo character to the terminal
        }
    }
}

// --- Helper Functions ---

function isShellCommandQuery(prompt) {
    const keywords = [ 'git', 'docker', 'npm', 'yarn', 'ls', 'cd', 'mkdir', 'grep', 'find', 'ssh', 'list', 'show', 'files', 'command', 'terminal', 'shell', 'cli' ];
    const lowerCasePrompt = prompt.toLowerCase();
    return keywords.some(keyword => lowerCasePrompt.includes(keyword));
}

// Main processing function now accepts an optional 'ptyEmitter' to write back to the terminal
async function processRequest(userPrompt, editor, selection, outputTarget, ptyEmitter = null) {
    if (outputTarget === 'editor' && !editor) {
        return vscode.window.showInformationMessage('No active editor to write to.');
    }
    
    try {
        if (!ptyEmitter) { // Show progress notification only for non-terminal commands
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "CodeDawn is thinking...",
            }, (progress) => {
                return runApiCall(userPrompt, editor, selection, outputTarget, ptyEmitter);
            });
        } else {
            await runApiCall(userPrompt, editor, selection, outputTarget, ptyEmitter);
        }
    } catch (error) {
        console.error(error);
        const errorMessage = 'CodeDawn Error: ' + error.message;
        if (ptyEmitter) {
            ptyEmitter.fire(`\r\n${errorMessage}\r\n`);
        } else {
            vscode.window.showErrorMessage(errorMessage);
        }
    }
}

async function runApiCall(userPrompt, editor, selection, outputTarget, ptyEmitter) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not found in .env file.");

    const modelName = "gemini-1.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    let fullPrompt = userPrompt;
    if (selection && !selection.isEmpty && editor) {
        const selectedText = editor.document.getText(selection);
        fullPrompt = `${userPrompt}:\n\n\`\`\`\n${selectedText}\n\`\`\``;
    }

    const payload = {
        contents: [{
            parts: [{ text: `You are a VS Code AI assistant. Generate only the raw code or command for the following request, without any explanation, intro, or markdown formatting. Request: ${fullPrompt}` }]
        }]
    };

    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    if (!result.candidates || result.candidates.length === 0) {
        throw new Error("API returned no candidates.");
    }
    
    const generatedText = result.candidates[0].content.parts[0].text.trim();

    if (outputTarget === 'terminal') {
        if (ptyEmitter) { // If called from our custom terminal, write back to it
            ptyEmitter.fire(`${generatedText}\r\n`);
        } else { // If called from Ctrl+L, send to a standard terminal
            let terminal = vscode.window.terminals.find(t => t.name === 'DAWN') || vscode.window.createTerminal("DAWN");
            terminal.show();
            terminal.sendText(generatedText, false);
        }
    } else { // 'editor'
        editor.edit(editBuilder => {
            editBuilder.replace(selection, generatedText);
});
    }

    if (!ptyEmitter) {
        vscode.window.showInformationMessage("CodeDawn finished!");
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};