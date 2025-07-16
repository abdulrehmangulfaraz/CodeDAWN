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
    let disposable = vscode.commands.registerCommand('codedawn.invoke', function () {
        // The code you place here will be executed every time your command is executed

        // For now, just display a message to confirm it's working
        vscode.window.showInformationMessage('CodeDawn invoked!');
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}
