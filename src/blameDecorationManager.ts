import * as vscode from 'vscode';
import { GitBlameProvider, BlameInfo } from './gitBlameProvider';

export class BlameDecorationManager {
    private decorationType: vscode.TextEditorDecorationType;
    private uncommittedDecorationType: vscode.TextEditorDecorationType;
    private isEnabled: boolean = true;
    private debounceTimer: NodeJS.Timeout | null = null;
    private disposables: vscode.Disposable[] = [];

    constructor(private blameProvider: GitBlameProvider) {
        // Create decoration types
        this.decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                color: '#888888',
                fontStyle: 'italic',
                margin: '0 0 0 20px'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });

        this.uncommittedDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                color: '#ff6b6b',
                fontStyle: 'italic',
                margin: '0 0 0 20px'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });

        // Listen to configuration changes
        const configChange = vscode.workspace.onDidChangeConfiguration(() => {
            this.updateEnabledState();
        });

        this.disposables.push(configChange);
        this.updateEnabledState();
    }

    /**
     * Toggle blame annotations
     */
    public toggleBlame(): void {
        this.isEnabled = !this.isEnabled;
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            if (this.isEnabled) {
                this.updateBlame(editor.document);
            } else {
                this.clearDecorations();
            }
        }
        
        vscode.window.showInformationMessage(
            `Gitlen Lite blame annotations ${this.isEnabled ? 'enabled' : 'disabled'}`
        );
    }

    /**
     * Refresh blame annotations
     */
    public refreshBlame(): void {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            this.blameProvider.clearCache(editor.document.uri.fsPath);
            this.updateBlame(editor.document);
        }
    }

    /**
     * Update blame annotations for a document
     */
    public updateBlame(document: vscode.TextDocument, immediate: boolean = false): void {
        console.log('updateBlame called for:', document.uri.fsPath || document.fileName, 'immediate:', immediate);
        
        if (!this.isEnabled) {
            console.log('Blame is disabled, clearing decorations');
            this.clearDecorations();
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== document) {
            console.log('No active editor or document mismatch');
            return;
        }

        // Check if file is binary
        if (this.blameProvider.isBinaryFile(document.uri.fsPath || document.fileName)) {
            console.log('File is binary, skipping blame:', document.uri.fsPath || document.fileName);
            this.clearDecorations();
            return;
        }

        console.log('Starting blame update for:', document.uri.fsPath || document.fileName);

        // For immediate updates (like cursor movement), skip debounce
        if (immediate) {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = null;
            }
            this.performBlameUpdate(document, editor);
            return;
        }

        // Debounce updates for text changes
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        const config = vscode.workspace.getConfiguration('gitlen-lite');
        const debounceDelay = config.get<number>('debounceDelay', 500);

        console.log('Debounce delay:', debounceDelay, 'ms');

        this.debounceTimer = setTimeout(() => {
            this.performBlameUpdate(document, editor);
        }, debounceDelay);
    }

    /**
     * Perform the actual blame update
     */
    private async performBlameUpdate(document: vscode.TextDocument, editor: vscode.TextEditor): Promise<void> {
        console.log('performBlameUpdate starting for:', document.uri.fsPath || document.fileName);
        
        try {
            const blameData = await this.blameProvider.getBlame(document.uri);
            
            console.log('Blame data received:', blameData ? 'found' : 'null');
            
            if (!blameData) {
                console.log('No blame data available, clearing decorations');
                this.clearDecorations();
                return;
            }

            const config = vscode.workspace.getConfiguration('gitlen-lite');
            const dateFormat = config.get<string>('dateFormat', 'relative');
            const maxFileSize = config.get<number>('maxFileSize', 5000);

            console.log('Config - dateFormat:', dateFormat, 'maxFileSize:', maxFileSize);

            // Check file size limit
            if (document.lineCount > maxFileSize) {
                console.log('File too large:', document.lineCount, 'lines >', maxFileSize);
                this.showLargeFileWarning();
                this.clearDecorations();
                return;
            }

            console.log('Processing current line for blame decorations');

            const blameDecorations: vscode.DecorationOptions[] = [];
            const uncommittedDecorations: vscode.DecorationOptions[] = [];

            // Only show blame for the current line
            const currentLine = editor.selection.active.line;
            if (currentLine >= 0 && currentLine < document.lineCount) {
                const line = document.lineAt(currentLine);
                const blameInfo = blameData[currentLine + 1]; // Git lines are 1-based

                if (blameInfo) {
                    const decorationText = this.formatBlameText(blameInfo, dateFormat);
                    blameDecorations.push({
                        range: line.range,
                        renderOptions: {
                            after: {
                                contentText: decorationText
                            }
                        }
                    });
                } else {
                    // Uncommitted changes
                    uncommittedDecorations.push({
                        range: line.range,
                        renderOptions: {
                            after: {
                                contentText: 'Not Committed Yet'
                            }
                        }
                    });
                }
            }

            console.log('Created', blameDecorations.length, 'blame decorations and', uncommittedDecorations.length, 'uncommitted decorations');

            // Apply decorations
            editor.setDecorations(this.decorationType, blameDecorations);
            editor.setDecorations(this.uncommittedDecorationType, uncommittedDecorations);

            console.log('Decorations applied successfully');

        } catch (error) {
            console.error('Error updating blame:', error);
            this.clearDecorations();
        }
    }

    /**
     * Format blame text based on configuration
     */
    private formatBlameText(blameInfo: BlameInfo, dateFormat: string): string {
        const date = this.formatDate(blameInfo.date, dateFormat);
        const message = this.truncateMessage(blameInfo.commitMessage);
        
        return `${blameInfo.author}, ${date}, ${message}`;
    }

    /**
     * Truncate author name for display
     */
    private truncateAuthor(author: string): string {
        const maxLength = 15;
        if (author.length <= maxLength) {
            return author;
        }
        return author.substring(0, maxLength - 3) + '...';
    }

    /**
     * Truncate commit message for display
     */
    private truncateMessage(message: string): string {
        if (!message) {
            return '';
        }
        
        // Get first line only
        const firstLine = message.split('\n')[0].trim();
        const maxLength = 30;
        
        if (firstLine.length <= maxLength) {
            return firstLine;
        }
        
        return firstLine.substring(0, maxLength - 3) + '...';
    }

    /**
     * Format date based on configuration
     */
    private formatDate(date: Date, format: string): string {
        switch (format) {
            case 'relative':
                return this.getRelativeTime(date);
            case 'absolute':
                return date.toLocaleDateString();
            case 'iso':
                return date.toISOString().split('T')[0];
            default:
                return this.getRelativeTime(date);
        }
    }

    /**
     * Get relative time string
     */
    private getRelativeTime(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMins = Math.floor(diffMs / (1000 * 60));
                return diffMins <= 1 ? 'just now' : `${diffMins} mins ago`;
            }
            return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
        } else if (diffDays === 1) {
            return 'yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return months === 1 ? '1 month ago' : `${months} months ago`;
        } else {
            const years = Math.floor(diffDays / 365);
            return years === 1 ? '1 year ago' : `${years} years ago`;
        }
    }

    /**
     * Clear all decorations
     */
    private clearDecorations(): void {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.setDecorations(this.decorationType, []);
            editor.setDecorations(this.uncommittedDecorationType, []);
        }
    }

    /**
     * Show warning for large files
     */
    private showLargeFileWarning(): void {
        vscode.window.showWarningMessage(
            'File is too large for automatic blame annotations. Use the command palette to manually refresh blame.',
            'Refresh Blame'
        ).then(selection => {
            if (selection === 'Refresh Blame') {
                this.refreshBlame();
            }
        });
    }

    /**
     * Update enabled state from configuration
     */
    private updateEnabledState(): void {
        const config = vscode.workspace.getConfiguration('gitlen-lite');
        this.isEnabled = config.get<boolean>('enabled', true);
        
        if (!this.isEnabled) {
            this.clearDecorations();
        }
    }

    /**
     * Check if blame is enabled
     */
    public get isBlameEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.decorationType.dispose();
        this.uncommittedDecorationType.dispose();
        this.disposables.forEach(d => d.dispose());
    }
}
