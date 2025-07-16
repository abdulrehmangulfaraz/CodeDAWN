const vscode = require('vscode');
const fetch = require('node-fetch');

require('dotenv').config({ path: __dirname + '/.env' });

function activate(context) {
    console.log('Congratulations, your extension "CodeDawn" is now active!');

    // Helper function to check if a prompt is for a shell command
    function isShellCommandQuery(prompt) {
        const keywords = ['git', 'docker', 'npm', 'yarn', 'ls', 'cd', 'mkdir', 'grep', 'find', 'ssh'];
        const lowerCasePrompt = prompt.toLowerCase();
        return keywords.some(keyword => lowerCasePrompt.includes(keyword));
    }

    // Helper function for the main AI logic
    async function runCodeDawn(prompt, selection) {
        // ... (This would contain the API call logic to avoid repetition)
        // For now, we'll keep it inline to be clear.
    }

    // COMMAND 1: Invoke from Editor (Ctrl+L)
    let editorInvoke = vscode.commands.registerCommand('codedawn.invoke', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return vscode.window.showInformationMessage('No active editor found.'); }

        const selection = editor.selection;
        const userPrompt = await vscode.window.showInputBox({ prompt: "CodeDawn: What would you like to do?" });
        
        if (userPrompt) {
            // This command always outputs to the editor
            await processRequest(userPrompt, editor, selection, 'editor');
        }
    });

    // COMMAND 2: Invoke for Terminal/Editor (from Command Palette)
    let terminalInvoke = vscode.commands.registerCommand('codedawn.terminalInvoke', async function () {
        const editor = vscode.window.activeTextEditor;
        const selection = editor ? editor.selection : undefined;
        
        const userPrompt = await vscode.window.showInputBox({ prompt: "CodeDawn: What can I help with?" });

        if (userPrompt) {
            // Decide the output target based on the prompt
            const target = isShellCommandQuery(userPrompt) ? 'terminal' : 'editor';
            await processRequest(userPrompt, editor, selection, target);
        }
    });

    context.subscriptions.push(editorInvoke, terminalInvoke);
}

// Main processing function to handle API calls and output
async function processRequest(userPrompt, editor, selection, outputTarget) {
    if (outputTarget === 'editor' && !editor) {
        return vscode.window.showInformationMessage('No active editor to write to.');
    }
    
    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "CodeDawn is thinking...",
            cancellable: true
        }, async (progress, token) => {
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
                    parts: [{ text: `You are a VS Code AI assistant called CodeDawn. Generate only the raw code or command for the following request, without any explanation, intro, or markdown formatting. Request: ${fullPrompt}` }]
                }]
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }

            const result = await response.json();
            if (!result.candidates || result.candidates.length === 0) {
                throw new Error("API returned no candidates.");
            }
            
            const generatedText = result.candidates[0].content.parts[0].text;

            // Route the output to the correct destination
            if (outputTarget === 'terminal') {
                const terminal = vscode.window.activeTerminal || vscode.window.createTerminal("CodeDawn");
                terminal.show();
                terminal.sendText(generatedText, false); // false = don't execute immediately
            } else { // 'editor'
                editor.edit(editBuilder => {
                    editBuilder.replace(selection, generatedText);
                });
            }
            vscode.window.showInformationMessage("CodeDawn finished!");
        });
    } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage('CodeDawn Error: ' + error.message);
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};