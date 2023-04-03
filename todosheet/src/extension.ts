import * as vscode from "vscode"

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "todosheet" is now active!')

	context.subscriptions.push(
		vscode.commands.registerCommand("todosheet.helloWorld", () => {
			vscode.window.showInformationMessage("Hello from TodoSheet!")
		})
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("todosheet.askQuestion", async () => {
			const answer = await vscode.window.showInformationMessage(
				"How was your day?",
				"Good",
				"Bad"
			)

			if (answer === "Bad") {
				vscode.window.showInformationMessage("Sorry to hear that :(")
			} else {
				console.log({ answer })
			}
		})
	)
}

export function deactivate() {}
