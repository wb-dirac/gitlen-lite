import * as vscode from 'vscode';
import { GitBlameProvider } from './gitBlameProvider';
import { BlameDecorationManager } from './blameDecorationManager';
import { HoverProvider } from './hoverProvider';
import { DiffProvider } from './diffProvider';

let blameProvider: GitBlameProvider;
let decorationManager: BlameDecorationManager;
let hoverProvider: HoverProvider;
let diffProvider: DiffProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('Gitlen Lite extension is now active!');

    // Initialize core services
    blameProvider = new GitBlameProvider();
    decorationManager = new BlameDecorationManager(blameProvider);
    hoverProvider = new HoverProvider(blameProvider);
    diffProvider = new DiffProvider(blameProvider);

    console.log('Gitlen Lite services initialized');

    // Register providers
    const hoverRegistration = vscode.languages.registerHoverProvider(
        { scheme: 'file' },
        hoverProvider
    );

    console.log('Hover provider registered');

    // Register commands
    const toggleBlameCommand = vscode.commands.registerCommand('gitlen-lite.toggleBlame', () => {
        console.log('Toggle blame command executed');
        decorationManager.toggleBlame();
    });

    const refreshBlameCommand = vscode.commands.registerCommand('gitlen-lite.refreshBlame', () => {
        console.log('Refresh blame command executed');
        decorationManager.refreshBlame();
    });

    const copyHashCommand = vscode.commands.registerCommand('gitlen-lite.copyHash', (commitHash: string) => {
        console.log('Copy hash command executed:', commitHash);
        vscode.env.clipboard.writeText(commitHash);
        vscode.window.showInformationMessage(`Commit hash ${commitHash.substring(0, 8)} copied to clipboard`);
    });

    const compareWithPreviousCommand = vscode.commands.registerCommand('gitlen-lite.compareWithPrevious', async (commitHash: string) => {
        console.log('Compare with previous command executed:', commitHash);
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        await diffProvider.compareWithPrevious(editor.document.uri, commitHash);
    });

    const debugCommand = vscode.commands.registerCommand('gitlen-lite.debug', () => {
        console.log('=== Gitlen Lite Debug Info ===');
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            console.log('Active editor:', editor.document.uri.fsPath);
            console.log('Language:', editor.document.languageId);
            console.log('Line count:', editor.document.lineCount);
            console.log('Is enabled:', decorationManager.isBlameEnabled);
        } else {
            console.log('No active editor');
        }
        
        console.log('=== End Debug Info ===');
        vscode.window.showInformationMessage('Debug info logged to console');
    });

    console.log('Commands registered');

    // Register event listeners
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((event) => {
        console.log('Text document changed:', event.document.uri.fsPath);
        if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
            decorationManager.updateBlame(event.document);
        }
    });

    const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor((editor) => {
        console.log('Active text editor changed:', editor ? editor.document.uri.fsPath : 'none');
        if (editor) {
            decorationManager.updateBlame(editor.document);
        }
    });

    const onDidChangeTextEditorSelection = vscode.window.onDidChangeTextEditorSelection((event) => {
        if (event.textEditor === vscode.window.activeTextEditor) {
            // Update blame when cursor moves (immediate update for better UX)
            console.log('Cursor moved, updating blame immediately');
            decorationManager.updateBlame(event.textEditor.document, true);
        }
    });

    console.log('Event listeners registered');

    // Add disposables to context
    context.subscriptions.push(
        hoverRegistration,
        toggleBlameCommand,
        refreshBlameCommand,
        copyHashCommand,
        compareWithPreviousCommand,
        debugCommand,
        onDidChangeTextDocument,
        onDidChangeActiveTextEditor,
        onDidChangeTextEditorSelection,
        decorationManager,
        blameProvider
    );

    console.log('All disposables added to context');

    // Initialize blame for current editor
    if (vscode.window.activeTextEditor) {
        console.log('Initializing blame for current editor:', vscode.window.activeTextEditor.document.uri.fsPath);
        decorationManager.updateBlame(vscode.window.activeTextEditor.document);
    } else {
        console.log('No active text editor found during activation');
    }
}

export function deactivate() {
    console.log('Gitlen Lite extension deactivated');
}
