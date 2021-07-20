import * as Definitions from './definitions';
import { TextEditorWithDecorations } from './abstractions/text-editor-with-decorations';
import { TextEditorWithDecorations as ConcreteTextEditorWithDecorations } from './implementations/text-editor-with-decorations';

import * as vscode from 'vscode';

export function make(uncoveredCodeRegionsDocumentContentProvider: vscode.TextDocumentContentProvider) {
  return new Cov(uncoveredCodeRegionsDocumentContentProvider);
}

class Cov {
  constructor(uncoveredCodeRegionsDocumentContentProvider: vscode.TextDocumentContentProvider) {
    this.output = vscode.window.createOutputChannel(Definitions.extensionId);
    this.command = vscode.commands.registerCommand(`${Definitions.extensionId}.reportUncoveredCodeRegionsInFile`, this.run, this);
    this.textDocumentProvider = vscode.workspace.registerTextDocumentContentProvider(Definitions.extensionId, uncoveredCodeRegionsDocumentContentProvider);
    this.openedUncoveredCodeRegionsDocuments_ = new Map<string, vscode.TextDocument>();
  }

  get asDisposable() {
    return vscode.Disposable.from(this);
  }

  get outputChannel() {
    return this.output;
  }

  dispose() {
    [
      this.output,
      this.command,
      this.textDocumentProvider
    ].forEach(disposable => disposable.dispose());
  }

  async run() {
    this.reportStartInOutputChannel();

    const uri = this.buildVirtualDocumentUri();

    const virtualDocument = await vscode.workspace.openTextDocument(uri);

    this.addVirtualDocumentIfNotExist(uri, virtualDocument);

    await vscode.window.showTextDocument(virtualDocument, { preserveFocus: false });
  }

  get openedUncoveredCodeRegionsDocuments(): ReadonlyMap<string, vscode.TextDocument> {
    return this.openedUncoveredCodeRegionsDocuments_;
  }

  get uncoveredCodeRegionsDocumentProvider() {
    return this.textDocumentProvider;
  }

  get activeTextEditor(): TextEditorWithDecorations | undefined {
    if (!vscode.window.activeTextEditor)
      return;

    return new ConcreteTextEditorWithDecorations(vscode.window.activeTextEditor);
  }

  private reportStartInOutputChannel() {
    this.output.show(true);
    this.output.clear();
    this.output.appendLine(`starting ${Definitions.extensionDisplayName}`);
  }

  private buildVirtualDocumentUri() {
    return vscode.Uri.from({
      scheme: Definitions.extensionId,
      path: (<vscode.TextEditor>vscode.window.activeTextEditor).document.uri.path
    });
  }

  private addVirtualDocumentIfNotExist(uri: vscode.Uri, doc: vscode.TextDocument) {
    if (!this.openedUncoveredCodeRegionsDocuments_.has(uri.fsPath))
      this.openedUncoveredCodeRegionsDocuments_.set(uri.fsPath, doc);
  }

  private readonly output: vscode.OutputChannel;
  private readonly command: vscode.Disposable;
  private readonly textDocumentProvider: vscode.Disposable;
  private readonly openedUncoveredCodeRegionsDocuments_: Map<string, vscode.TextDocument>;
}
