const vscode = require('vscode');
const fetch = require('node-fetch');

require('dotenv').config({ path: __dirname + '/.env' });

function activate(context) {
    console.log('Congratulations, your extension "CodeDawn" is now active!');

    const invokeCommand = vscode.commands.registerCommand('codedawn.invoke', async () => {
        const editor = vscode.window.activeTextEditor;
        const selection = editor ? editor.selection : undefined;
        
        const userPrompt = await vscode.window.showInputBox({ prompt: "CodeDawn" });

        if (userPrompt) {
            const target = isShellCommandQuery(userPrompt) ? 'terminal' : 'editor';
            await processRequest(userPrompt, editor, selection, target);
        }
    });

    const openTerminalCommand = vscode.commands.registerCommand('codedawn.openTerminal', () => {
        const pty = new DawnTerminal();
        const terminal = vscode.window.createTerminal({ name: 'DAWN', pty });
        terminal.show();
    });

    context.subscriptions.push(invokeCommand, openTerminalCommand);
}

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
        if (data === '\r') {
            this.writeEmitter.fire('\r\n');
            if (this.commandLine.trim().startsWith('dawn ')) {
                const userPrompt = this.commandLine.replace('dawn ', '').trim();
                const editor = vscode.window.activeTextEditor;
                const selection = editor ? editor.selection : undefined;
                processRequest(userPrompt, editor, selection, 'terminal', this.writeEmitter);
            } else if (this.commandLine.trim() !== '') {
                this.writeEmitter.fire(`Unknown command: "${this.commandLine.trim()}". Please use the format: dawn <prompt>\r\n`);
            }
            this.commandLine = '';
            this.writeEmitter.fire('$ ');
        } else if (data === '\x7f') {
            if (this.commandLine.length > 0) {
                this.commandLine = this.commandLine.slice(0, -1);
                this.writeEmitter.fire('\b \b');
            }
        } else {
            this.commandLine += data;
            this.writeEmitter.fire(data);
        }
    }
}

function isShellCommandQuery(prompt) {
    const keywords = [ 'git', 'docker', 'npm', 'yarn', 'ls', 'cd', 'mkdir', 'grep', 'find', 'ssh', 'list', 'show', 'files', 'command', 'terminal', 'shell', 'cli' ];
    const lowerCasePrompt = prompt.toLowerCase();
    return keywords.some(keyword => lowerCasePrompt.includes(keyword));
}

// Main processing function
async function processRequest(userPrompt, editor, selection, outputTarget, ptyEmitter = null) {
    if (outputTarget === 'editor' && !editor) {
        return vscode.window.showInformationMessage('No active editor to write to.');
    }
    
    try {
        if (!ptyEmitter) {
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

// Extracts raw code from a markdown code block
function extractCode(text) {
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]+?)\n```/;
    const match = text.match(codeBlockRegex);
    return match ? match[1] : text;
}

async function runApiCall(userPrompt, editor, selection, outputTarget, ptyEmitter) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not found in .env file.");

    const modelName = "gemini-1.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // NEW: Get the language of the current file to provide context
    const fileLanguage = editor ? editor.document.languageId : 'text';

    let fullPrompt = userPrompt;
    if (selection && !selection.isEmpty && editor) {
        const selectedText = editor.document.getText(selection);
        fullPrompt = `${userPrompt}:\n\n\`\`\`\n${selectedText}\n\`\`\``;
    }

    // UPDATED: The system prompt now includes the file's language
    const systemPrompt = `You are a VS Code AI assistant. Your response must be only the code itself, with no explanation or markdown formatting. The user is currently in a file of type '${fileLanguage}'. Fulfill the following request: ${fullPrompt}`;

    const payload = {
        contents: [{
            parts: [{ text: systemPrompt }]
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
    
    // NEW: Extract only the code from the AI's response
    const rawText = result.candidates[0].content.parts[0].text;
    const generatedText = extractCode(rawText).trim();

    if (outputTarget === 'terminal') {
        if (ptyEmitter) {
            ptyEmitter.fire(`${generatedText}\r\n`);
        } else {
            let terminal = vscode.window.terminals.find(t => t.name === 'DAWN') || vscode.window.createTerminal("DAWN");
            terminal.show();
            terminal.sendText(generatedText, false);
        }
    } else {
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