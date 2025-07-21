const vscode = require('vscode');
const fetch = require('node-fetch');

function activate(context) {
    console.log('Congratulations, your extension "CodeDawn" is now active!');

    const setApiKeyCommand = vscode.commands.registerCommand('codedawn.setApiKey', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'codedawn.geminiApiKey');
    });

    const focusOnGeminiCommand = vscode.commands.registerCommand('codedawn.focusOnGeminiKey', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'codedawn.geminiApiKey');
    });
    const focusOnGroqCommand = vscode.commands.registerCommand('codedawn.focusOnGroqKey', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'codedawn.groqApiKey');
    });

    const invokeCommand = vscode.commands.registerCommand('codedawn.invoke', async () => {
        const editor = vscode.window.activeTextEditor;
        const selection = editor ? editor.selection : undefined;
        const userPrompt = await vscode.window.showInputBox({ prompt: ">" });
        if (userPrompt) {
            await processRequest(userPrompt, editor, selection);
        }
    });
    
    context.subscriptions.push(
        invokeCommand, 
        setApiKeyCommand,
        focusOnGeminiCommand,
        focusOnGroqCommand
    );
}

// --- Helper Functions ---

function extractCode(text) {
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]+?)\n```/;
    const match = text.match(codeBlockRegex);
    return match ? match[1] : text;
}

async function handleApiError(error) {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        const selection = await vscode.window.showErrorMessage(
            'CodeDawn: API usage quota reached. Try another provider or change your key.',
            'Open Settings'
        );
        if (selection === 'Open Settings') {
            vscode.commands.executeCommand('codedawn.setApiKey');
        }
    } else if (errorMessage.includes('400') || errorMessage.includes('401') || errorMessage.includes('api key not valid')) {
        const selection = await vscode.window.showErrorMessage(
            'CodeDawn: Your API Key is invalid or has been revoked.',
            'Change API Key'
        );
        if (selection === 'Change API Key') {
            vscode.commands.executeCommand('codedawn.setApiKey');
        }
    } else {
        vscode.window.showErrorMessage('CodeDawn Error: ' + error.message);
    }
}

async function processRequest(userPrompt, editor, selection) {
    const outputTarget = 'editor'; // Always target the editor

    if (outputTarget === 'editor' && !editor) {
        return vscode.window.showInformationMessage('No active editor to write to.');
    }
    
    const config = vscode.workspace.getConfiguration('codedawn');
    const geminiKey = config.get('geminiApiKey');
    const groqKey = config.get('groqApiKey');

    let provider;
    // Determine which provider to use
    if (geminiKey) {
        provider = 'Gemini';
    } else if (groqKey) {
        provider = 'Groq';
    }

    // Now, check if a provider was successfully determined.
    if (provider) {
        // If a key exists, proceed with the API call.
        try {
            await runApiCall(userPrompt, editor, selection, outputTarget, provider);
        } catch (error) {
            console.error(error);
            handleApiError(error);
        }
    } else {
        // If no key was found, show the welcome/setup message.
        const selection = await vscode.window.showInformationMessage(
            'Welcome to CodeDawn! Please set your AI API Key to begin.', 'Open Settings'
        );
        if (selection === 'Open Settings') {
            vscode.commands.executeCommand('codedawn.setApiKey');
        }
    }
}

async function runApiCall(userPrompt, editor, selection, outputTarget, provider) {
    let resultText;
    if (provider === 'Groq') {
        resultText = await callGroqAPI(userPrompt, editor, selection);
    } else {
        resultText = await callGeminiAPI(userPrompt, editor, selection);
    }

    const generatedText = extractCode(resultText).trim();

    editor.edit(editBuilder => {
        editBuilder.replace(selection, generatedText);
    });
}

function constructFullPrompt(userPrompt, editor, selection) {
    const fileLanguage = editor ? editor.document.languageId : 'text';
    let fullPrompt = userPrompt;
    if (selection && !selection.isEmpty && editor) {
        const selectedText = editor.document.getText(selection);
        fullPrompt = `${userPrompt}:\n\n\`\`\`\n${selectedText}\n\`\`\``;
    }
    return `You are a VS Code AI assistant. Your response must be only the code itself, with no explanation or markdown formatting. The user is currently in a file of type '${fileLanguage}'. Fulfill the following request: ${fullPrompt}`;
}
async function callGeminiAPI(userPrompt, editor, selection) {
    const apiKey = vscode.workspace.getConfiguration('codedawn').get('geminiApiKey');
    if (!apiKey) throw new Error("API key not found.");
    const modelName = "gemini-1.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const systemPrompt = constructFullPrompt(userPrompt, editor, selection);
    const payload = { contents: [{ parts: [{ text: systemPrompt }] }] };
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`API key not valid or another API error occurred (${response.status})`);
    const result = await response.json();
    if (!result.candidates || !result.candidates.length) throw new Error("API returned no candidates.");
    return result.candidates[0].content.parts[0].text;
}
async function callGroqAPI(userPrompt, editor, selection) {
    const apiKey = vscode.workspace.getConfiguration('codedawn').get('groqApiKey');
    if (!apiKey) throw new Error("API key not found.");
    const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    const systemPrompt = constructFullPrompt(userPrompt, editor, selection);
    const payload = { model: "llama3-8b-8192", messages: [{ role: "user", content: systemPrompt }] };
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`API key not valid or another API error occurred (${response.status})`);
    const result = await response.json();
    if (!result.choices || !result.choices.length) throw new Error("API returned no choices.");
    return result.choices[0].message.content;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};