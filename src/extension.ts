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
						// @ts-ignore
						const relativePath: string = vscode.workspace.asRelativePath(tab.input.uri.path);
						return {
							label: `${path.basename(relativePath)}`,
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
			var sortedItems: MyItem[] = [
				...tabItems,
				...vscode.window.terminals.map(
					terminal => {
						return {
							label: terminal.name,
							_type: 'terminal',
							terminal: terminal,
						} as MyItem;
					}
				)
			];

			function sortItemsByName(a: MyItem, b: MyItem): number {
				if (!!a.tab?.isPinned !== !!b.tab?.isPinned) {
					return !!a.tab?.isPinned ? -1 : 1;
				}
				if (!!a.terminal !== !!b.terminal) {
					return !!a.terminal ? -1 : 1;
				}
				return a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1;
			}
			sortedItems.sort(sortItemsByName);
			const showAnyIcon: boolean = sortedItems.some(
				item => (
					(item._type === 'file' && (item.tab?.isPinned || item.tab?.isDirty))
					|| item._type === 'terminal'
				)
			);
			sortedItems = sortedItems.map(item => {
				var icon: string = showAnyIcon ? '    \u{2009}' : '';
				if (item._type === 'file') {
					if (item.tab?.isPinned && item.tab?.isDirty) {
						icon = '$(pinned-dirty)';
					} else if (item.tab?.isPinned) {
						icon = '$(pinned)';
					} else if (item.tab?.isDirty) {
						icon = '$(close-dirty)';
					}
				} else if (item._type === 'terminal') {
					icon = '$(terminal)';
				}
				if (icon !== '') {
					icon = `${icon} `;
				}

				return { ...item, label: `${icon}${item.label}` };
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
export function deactivate() { }
