// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { QuickPickItem, Tab, Uri, Terminal } from 'vscode';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	interface MyItem extends QuickPickItem {
		_type: 'file' | 'terminal',
		terminal?: Terminal,
		tab?: Tab,
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('tabloid.showTabSwitcher', async () => {
			const tabItems: MyItem[] = vscode.window.tabGroups.all.flatMap(
				group => group.tabs.flatMap(
					(tab: Tab) => {
						if (!(typeof tab.input === 'object' && tab.input !== null && 'uri' in tab.input)) {
							return [];
						}
						const icon: string = tab.isPinned ? '$(pinned) ' : '';
						// @ts-ignore
						const relativePath: string = vscode.workspace.asRelativePath(tab.input.uri.path);
						return {
							label: `${icon}${path.basename(relativePath)}`,
							description: path.dirname(relativePath),
							_type: 'file',
							tab: tab,
						};
					}
				)
			);
			// const t = tabs.reduce<Map<string, Array<string>>>(
			// 	(previousValue, currentValue) => {
			// 		const basename: string = path.basename(currentValue.path);
			// 		const currentArray: Array<string> = previousValue.get(basename) || new Array();
			// 		currentArray.push(currentValue.path);
			// 		previousValue.set(basename, currentArray);
			// 		return previousValue;
			// 	},
			// 	new Map(),
			// );
			var sortedItems: MyItem[] = tabItems.filter(item => item.tab?.isPinned);
			sortedItems.push(...vscode.window.terminals.map(
				terminal => {
					const result: MyItem = {
						label: `$(terminal) ${terminal.name}`,
						_type: 'terminal',
						terminal: terminal,
					};
					return result;
				}
			));
			sortedItems.push(...tabItems.filter(item => !item.tab?.isPinned));
			sortedItems = sortedItems.map((item, index) => {
				return {...item, label: `${index + 1}: ${item.label}`};
			});
			const choice: undefined | MyItem = await vscode.window.showQuickPick<MyItem>(
				sortedItems,
				{
					title: 'Select an editor to open',
					matchOnDescription: true,
				}
			);
			if (!!choice) {
				if (choice._type === 'file') {
					vscode.window.showTextDocument(
						// @ts-ignore
						Uri.parse(choice.tab?.input.uri.path),
						{
							viewColumn: choice.tab?.group.viewColumn,
						}
					);
				} else if (choice._type === 'terminal') {
					choice.terminal?.show(false);
				}
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
