import * as vscode from 'vscode';
import { GitBlameProvider, BlameInfo } from './gitBlameProvider';

export class DiffProvider {
    private blameProvider: GitBlameProvider;

    constructor(blameProvider: GitBlameProvider) {
        this.blameProvider = blameProvider;
    }

    /**
     * Show file history
     */
    public async showFileHistory(uri: vscode.Uri): Promise<void> {
        const git = await this.blameProvider.getGitRepository(uri);
        if (!git) {
            vscode.window.showErrorMessage('Not in a git repository');
            return;
        }

        try {
            const log = await git.log({ file: uri.fsPath });
            if (log.total === 0) {
                vscode.window.showInformationMessage('No history found for this file');
                return;
            }

            // Show quick pick with commit history
            const items = log.all.slice(0, 20).map(commit => ({
                label: `${commit.hash.substring(0, 8)} - ${commit.message}`,
                description: `${commit.author_name} - ${commit.date}`,
                hash: commit.hash
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a commit to view'
            });

            if (selected) {
                await this.showDiff(uri, selected.hash);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get file history: ${error}`);
        }
    }

    /**
     * Show diff between current version and specified commit
     */
    public async showDiff(uri: vscode.Uri, commitHash: string): Promise<void> {
        const git = await this.blameProvider.getGitRepository(uri);
        if (!git) {
            vscode.window.showErrorMessage('Not in a git repository');
            return;
        }

        try {
            // Get the diff output
            const diff = await git.diff([commitHash, '--', uri.fsPath]);
            
            // Create a new document with the diff
            const diffDoc = await vscode.workspace.openTextDocument({
                content: diff,
                language: 'diff'
            });

            // Show the diff in a new tab
            await vscode.window.showTextDocument(diffDoc);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show diff: ${error}`);
        }
    }

    /**
     * Compare with previous commit (for hover action)
     */
    public async compareWithPrevious(uri: vscode.Uri, commitHash: string): Promise<void> {
        const git = await this.blameProvider.getGitRepository(uri);
        if (!git) {
            vscode.window.showErrorMessage('Not in a git repository');
            return;
        }

        try {
            console.log('Comparing commit:', commitHash, 'with previous commit');
            
            // Get the previous commit
            const log = await git.log({ file: uri.fsPath, maxCount: 10 });
            console.log('Git log result:', log.all.length, 'commits found');
            
            if (log.total < 2) {
                vscode.window.showInformationMessage('This is the first commit of this file');
                return;
            }

            const currentCommitIndex = log.all.findIndex(commit => commit.hash === commitHash);
            console.log('Current commit index:', currentCommitIndex);
            
            if (currentCommitIndex === -1 || currentCommitIndex >= log.all.length - 1) {
                vscode.window.showInformationMessage('No previous commit found for comparison');
                return;
            }

            const previousCommit = log.all[currentCommitIndex + 1];
            console.log('Previous commit:', previousCommit.hash);

            // Show diff between the two commits
            const diff = await git.diff([`${previousCommit.hash}..${commitHash}`, '--', uri.fsPath]);
            
            if (!diff || diff.trim() === '') {
                vscode.window.showInformationMessage('No differences found between commits');
                return;
            }

            const diffDoc = await vscode.workspace.openTextDocument({
                content: diff,
                language: 'diff'
            });

            await vscode.window.showTextDocument(diffDoc);
        } catch (error) {
            console.error('Error comparing with previous:', error);
            vscode.window.showErrorMessage(`Failed to compare with previous: ${error}`);
        }
    }

    /**
     * Show diff for uncommitted changes
     */
    public async showUncommittedDiff(uri: vscode.Uri): Promise<void> {
        const git = await this.blameProvider.getGitRepository(uri);
        if (!git) {
            vscode.window.showErrorMessage('Not in a git repository');
            return;
        }

        try {
            // Show diff of working directory vs HEAD
            const diff = await git.diff(['--', uri.fsPath]);
            
            if (!diff) {
                vscode.window.showInformationMessage('No uncommitted changes');
                return;
            }

            const diffDoc = await vscode.workspace.openTextDocument({
                content: diff,
                language: 'diff'
            });

            await vscode.window.showTextDocument(diffDoc);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show uncommitted diff: ${error}`);
        }
    }

    /**
     * Get blame info for a specific line
     */
    public async getBlameForLine(uri: vscode.Uri, lineNumber: number): Promise<BlameInfo | null> {
        const blameData = await this.blameProvider.getBlame(uri);
        if (!blameData) {
            return null;
        }

        return blameData[lineNumber + 1] || null; // Convert to 1-based
    }
}
