const vscode = require('vscode');
const fetch = require('node-fetch');

// Load environment variables from .env file
require('dotenv').config({ path: __dirname + '/.env' });

function activate(context) {
    console.log('Congratulations, your extension "CodeDawn" is now active!');

    let disposable = vscode.commands.registerCommand('codedawn.invoke', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active text editor found.');
            return;
        }

        const originalSelection = editor.selection;

        const userPrompt = await vscode.window.showInputBox({
            prompt: "CodeDawn: What would you like to do?",
            placeHolder: "e.g., 'refactor this to use arrow functions'",
            ignoreFocusOut: true,
        });

        if (userPrompt) {
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "CodeDawn is thinking...",
                    cancellable: true
                }, async (progress, token) => {

                    // --- GEMINI API CALL ---
                    // SECURE: Get API key from environment variable
                    const apiKey = process.env.GEMINI_API_KEY;
                    if (!apiKey) {
                        throw new Error("GEMINI_API_KEY not found. Please add it to your .env file.");
                    }
                    
                    // CORRECTED: Use a valid and current model name
                    const modelName = "gemini-1.5-flash";
                    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

                    const selectedText = editor.document.getText(originalSelection);
                    let fullPrompt = userPrompt;
                    if (selectedText) {
                        fullPrompt = `${userPrompt}:\n\n\`\`\`\n${selectedText}\n\`\`\``;
                    }

                    const payload = {
                        contents: [{
                            parts: [{ text: `You are a VS Code AI assistant called CodeDawn. Generate only the raw code for the following request, without any explanation, intro, or markdown formatting. Request: ${fullPrompt}` }]
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
                        throw new Error("API returned no candidates in the response.");
                    }
                    
                    const generatedText = result.candidates[0].content.parts[0].text;

                    editor.edit(editBuilder => {
                        editBuilder.replace(originalSelection, generatedText);
                    });

                    vscode.window.showInformationMessage("CodeDawn generated your code!");
                });

            } catch (error) {
                console.error(error);
                vscode.window.showErrorMessage('CodeDawn Error: ' + error.message);
            }
        } else {
            vscode.window.showInformationMessage('CodeDawn command cancelled.');
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};