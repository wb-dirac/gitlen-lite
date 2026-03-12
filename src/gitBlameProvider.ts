import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import simpleGit, { SimpleGit } from 'simple-git';

export interface BlameInfo {
    commitHash: string;
    author: string;
    date: Date;
    commitMessage: string;
    lineNumber: number;
    originalLineNumber: number;
}

export interface BlameData {
    [lineNumber: number]: BlameInfo;
}

export class GitBlameProvider implements vscode.Disposable {
    private gitRepositories: Map<string, SimpleGit> = new Map();
    private blameCache: Map<string, BlameData> = new Map();
    private disposables: vscode.Disposable[] = [];

    constructor() {
        // Watch for workspace folder changes
        this.disposables.push(
            vscode.workspace.onDidChangeWorkspaceFolders(() => {
                this.clearRepositoryCache();
            })
        );
    }

    /**
     * Get git instance for a given file path
     */
    public async getGitRepository(uri: vscode.Uri): Promise<SimpleGit | null> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            return null;
        }

        const repoPath = await this.findGitRepository(workspaceFolder.uri.fsPath);
        if (!repoPath) {
            return null;
        }

        if (!this.gitRepositories.has(repoPath)) {
            this.gitRepositories.set(repoPath, simpleGit(repoPath));
        }

        return this.gitRepositories.get(repoPath)!;
    }

    /**
     * Find git repository by traversing up from the given path
     */
    private async findGitRepository(startPath: string): Promise<string | null> {
        let currentPath = startPath;
        
        while (currentPath !== path.dirname(currentPath)) {
            const gitPath = path.join(currentPath, '.git');
            if (fs.existsSync(gitPath)) {
                return currentPath;
            }
            currentPath = path.dirname(currentPath);
        }
        
        return null;
    }

    /**
     * Get blame information for a file
     */
    public async getBlame(uri: vscode.Uri): Promise<BlameData | null> {
        console.log('getBlame called for:', uri.fsPath);
        
        try {
            // Check cache first
            const cacheKey = this.getCacheKey(uri.fsPath);
            if (this.blameCache.has(cacheKey)) {
                console.log('Returning cached blame data for:', uri.fsPath);
                return this.blameCache.get(cacheKey)!;
            }

            console.log('Fetching git repository for:', uri.fsPath);
            const git = await this.getGitRepository(uri);
            if (!git) {
                console.log('No git repository found for:', uri.fsPath);
                return null;
            }

            console.log('Git repository found, checking if file is tracked');
            // Check if file is tracked by git
            const isTracked = await this.isFileTracked(git, uri.fsPath);
            if (!isTracked) {
                console.log('File is not tracked by git:', uri.fsPath);
                return null;
            }

            console.log('File is tracked, fetching blame data');
            // Get blame data
            const blameData = await this.parseBlameOutput(git, uri.fsPath);
            
            console.log('Blame data parsed, lines:', Object.keys(blameData).length);
            
            // Cache the result
            this.blameCache.set(cacheKey, blameData);
            
            return blameData;
        } catch (error) {
            console.error(`Error getting blame for ${uri.fsPath}:`, error);
            return null;
        }
    }

    /**
     * Check if file is tracked by git
     */
    private async isFileTracked(git: SimpleGit, filePath: string): Promise<boolean> {
        try {
            // Try to get blame directly - if it works, file is tracked
            const blameResult = await git.raw(['blame', filePath]);
            return typeof blameResult === 'string' && blameResult.length > 0;
        } catch (error) {
            console.log('File is not tracked or has no blame info:', error);
            return false;
        }
    }

    /**
     * Get repository root path
     */
    private async getRepositoryRoot(git: SimpleGit): Promise<string> {
        const status = await git.status();
        return status.current ? path.dirname(status.current) : '';
    }

    /**
     * Parse git blame output into structured data
     */
    private async parseBlameOutput(git: SimpleGit, filePath: string): Promise<BlameData> {
        const blameText = await git.raw(['blame', '--line-porcelain', filePath]);
        const lines = blameText.split('\n');
        
        const blameData: BlameData = {};
        let currentBlame: Partial<BlameInfo> | null = null;
        let lineNumber = 1;

        for (const line of lines) {
            if (line.match(/^[0-9a-f]{40}\s+\d+\s+\d+/)) {
                // Start of a new blame block
                const match = line.match(/([0-9a-f]{40})\s+(\d+)\s+(\d+)/);
                if (match) {
                    currentBlame = {
                        commitHash: match[1],
                        originalLineNumber: parseInt(match[2]),
                        lineNumber: parseInt(match[3])
                    };
                }
            } else if (currentBlame && line.startsWith('author ')) {
                currentBlame.author = line.substring(7).trim();
            } else if (currentBlame && line.startsWith('author-time ')) {
                currentBlame.date = new Date(parseInt(line.substring(12)) * 1000);
            } else if (currentBlame && line.startsWith('summary ')) {
                currentBlame.commitMessage = line.substring(8).trim();
            } else if (currentBlame && line.startsWith('\t')) {
                // This is the actual line content, finalize the blame info
                blameData[lineNumber] = {
                    commitHash: currentBlame.commitHash!,
                    author: currentBlame.author || 'Unknown',
                    date: currentBlame.date || new Date(),
                    commitMessage: currentBlame.commitMessage || 'No message',
                    lineNumber: lineNumber,
                    originalLineNumber: currentBlame.originalLineNumber!
                };
                lineNumber++;
                currentBlame = null;
            }
        }

        return blameData;
    }

    /**
     * Check if file is binary
     */
    public isBinaryFile(filePath: string): boolean {
        const ext = path.extname(filePath).toLowerCase();
        const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.pdf', 
                                '.exe', '.dll', '.so', '.dylib', '.zip', '.tar', '.gz'];
        return binaryExtensions.includes(ext);
    }

    /**
     * Clear blame cache for a specific file
     */
    public clearCache(filePath?: string): void {
        if (filePath) {
            const cacheKey = this.getCacheKey(filePath);
            this.blameCache.delete(cacheKey);
        } else {
            this.blameCache.clear();
        }
    }

    /**
     * Clear repository cache
     */
    public clearRepositoryCache(): void {
        this.gitRepositories.clear();
        this.blameCache.clear();
    }

    /**
     * Generate cache key for file path
     */
    private getCacheKey(filePath: string): string {
        return filePath;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.clearRepositoryCache();
    }
}
