import * as vscode from 'vscode';
import { GitBlameProvider, BlameInfo } from './gitBlameProvider';

export class HoverProvider implements vscode.HoverProvider {
    private blameProvider: GitBlameProvider;

    constructor(blameProvider: GitBlameProvider) {
        this.blameProvider = blameProvider;
    }

    /**
     * Provide hover for blame annotations
     */
    public async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null> {
        try {
            // Check if file is binary
            if (this.blameProvider.isBinaryFile(document.uri.fsPath)) {
                return null;
            }

            // Get blame data for the document
            const blameData = await this.blameProvider.getBlame(document.uri);
            if (!blameData) {
                return null;
            }

            // Get blame info for the current line (1-based)
            const lineNumber = position.line + 1;
            const blameInfo = blameData[lineNumber];

            if (!blameInfo) {
                // Uncommitted changes
                const content = this.createUncommittedHover();
                return new vscode.Hover([content], document.lineAt(position.line).range);
            }

            // Create hover content
            const content = this.createCommitHoverContent(blameInfo);
            return new vscode.Hover([content], document.lineAt(position.line).range);

        } catch (error) {
            console.error('Error providing hover:', error);
            return null;
        }
    }

    /**
     * Create hover content for committed changes
     */
    private createCommitHoverContent(blameInfo: BlameInfo): vscode.MarkdownString {
        const content = new vscode.MarkdownString();
        content.isTrusted = true;

        // Commit header
        content.appendMarkdown(`## Commit ${blameInfo.commitHash.substring(0, 8)}\n\n`);

        // Author and date
        const formattedDate = this.formatFullDate(blameInfo.date);
        content.appendMarkdown(`**Author:** ${blameInfo.author}\n`);
        content.appendMarkdown(`**Date:** ${formattedDate}\n\n`);

        // Commit message (truncate if too long)
        const message = this.truncateMessage(blameInfo.commitMessage, 200);
        content.appendMarkdown(`**Message:** ${message}\n\n`);

        // Action buttons
        content.appendMarkdown('---\n\n');
        content.appendMarkdown('**Actions:**\n');

        // Copy hash button
        const copyCommand = `[Copy Hash](command:gitlen-lite.copyHash?${encodeURIComponent(JSON.stringify(blameInfo.commitHash))})`;
        content.appendMarkdown(`- ${copyCommand}\n`);

        // Show in external tool button (we removed this command, so show a message)
        content.appendMarkdown(`- Show in External Tool (not implemented)\n`);

        // Diff comparison button
        const diffCommand = `[Compare with Previous](command:gitlen-lite.compareWithPrevious?${encodeURIComponent(JSON.stringify(blameInfo.commitHash))})`;
        content.appendMarkdown(`- ${diffCommand}\n`);

        return content;
    }

    /**
     * Create hover content for uncommitted changes
     */
    private createUncommittedHover(): vscode.MarkdownString {
        const content = new vscode.MarkdownString();
        content.isTrusted = true;

        content.appendMarkdown('## Uncommitted Changes\n\n');
        content.appendMarkdown('This line has been modified but not yet committed.\n\n');

        // Action buttons
        content.appendMarkdown('---\n\n');
        content.appendMarkdown('**Actions:**\n');
        content.appendMarkdown('- [Stage Changes](command:gitlen-lite.stageChanges)\n');
        content.appendMarkdown('- [Commit Changes](command:gitlen-lite.commitChanges)\n');

        return content;
    }

    /**
     * Format full date string
     */
    private formatFullDate(date: Date): string {
        return date.toLocaleString();
    }

    /**
     * Truncate message for display
     */
    private truncateMessage(message: string, maxLength: number): string {
        if (message.length <= maxLength) {
            return message;
        }
        return message.substring(0, maxLength - 3) + '...';
    }
}
