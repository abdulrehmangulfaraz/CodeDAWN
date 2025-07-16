// The module 'vscode' contains the VS Code extensibility API
const vscode = require('vscode');

/**
 * This method is called when your extension is activated.
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    console.log('Congratulations, your extension "CodeDawn" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('codedawn.invoke', async function () {
        // This function is now async to allow for awaiting user input

        // 1. Get the active text editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active text editor found. Please open a file.');
            return; // Exit if no editor is open
        }

        // 2. Show an input box to get the user's prompt
        // This mimics the command palette's appearance
        const userPrompt = await vscode.window.showInputBox({
            prompt: "CodeDawn: What would you like to do?",
            placeHolder: "e.g., 'refactor this to use arrow functions' or 'create a python class for a user'",
            ignoreFocusOut: true, // Keep the input box open even if focus moves
        });

        // 3. Check if the user provided a prompt
        if (userPrompt) {
            // For now, we'll just show the prompt back to the user to confirm it works.
            // In the next step, we will send this to the AI.
            vscode.window.showInformationMessage(`CodeDawn received: "${userPrompt}"`);
            console.log(`User Prompt: ${userPrompt}`);
        } else {
            vscode.window.showInformationMessage('CodeDawn command cancelled.');
        }
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}
