import * as Definitions from './definitions';
import { TextEditorWithDecorations } from './abstractions/text-editor-with-decorations';
import { DecorationLocationsProvider } from '../modules/decoration-locations-provider/abstractions/decoration-locations-provider';
import { TextEditorWithDecorations as ConcreteTextEditorWithDecorations } from './implementations/text-editor-with-decorations';

import * as vscode from 'vscode';
import { CoverageInfo } from '../modules/coverage-info-collector/abstractions/coverage-info';

export function make(uncoveredCodeRegionsDocumentContentProvider: vscode.TextDocumentContentProvider,
  decorationLocationsProvider: DecorationLocationsProvider) {
  return new Cov(uncoveredCodeRegionsDocumentContentProvider, decorationLocationsProvider);
}

class Cov {
  constructor(uncoveredCodeRegionsDocumentContentProvider: vscode.TextDocumentContentProvider,
    decorationLocationsProvider: DecorationLocationsProvider) {
    this.outputChannel_ = vscode.window.createOutputChannel(Definitions.extensionId);
    this.command = vscode.commands.registerCommand(`${Definitions.extensionId}.reportUncoveredCodeRegionsInFile`, this.run, this);
    this.textDocumentProvider = vscode.workspace.registerTextDocumentContentProvider(Definitions.extensionId, uncoveredCodeRegionsDocumentContentProvider);
    this.uncoveredCodeRegionsVirtualTextEditors_ = new Map<string, TextEditorWithDecorations>();
    this.decorationType_ = vscode.window.createTextEditorDecorationType({
      backgroundColor: {
        id: Definitions.uncoveredCodeRegionDecorationBackgroundColor
      }
    });
    this.decorationLocationsProvider = decorationLocationsProvider;
  }

  get asDisposable() {
    return vscode.Disposable.from(this);
  }

  get outputChannel() {
    return this.outputChannel_;
  }

  dispose() {
    [
      vscode.Disposable.from(this.outputChannel_),
      this.command,
      this.textDocumentProvider
    ].forEach(disposable => disposable.dispose());
  }

  private async run() {
    this.reportStartInOutputChannel();

    const uri = this.buildVirtualDocumentUri();

    const virtualDocument = await vscode.workspace.openTextDocument(uri);
    const virtualTextEditor = await vscode.window.showTextDocument(virtualDocument, { preserveFocus: false });
    const uncoveredCodeRegionsVirtualTextEditor = new ConcreteTextEditorWithDecorations(virtualTextEditor);
    this.addUncoveredCodeRegionsVirtualEditorIfNotExist(uri, uncoveredCodeRegionsVirtualTextEditor);

    let uncoveredCodeInfo: CoverageInfo;

    try {
      uncoveredCodeInfo = await this.decorationLocationsProvider.getDecorationLocationsForUncoveredCodeRegions(uri.fsPath);
    } catch (error) {
      this.outputChannel_.appendLine(error.message);
      throw error;
    }

    uncoveredCodeRegionsVirtualTextEditor.setDecorations(this.decorationType, []);
  }

  // TODO: may be disposed of when tests will be exhaustive enough
  get uncoveredCodeRegionsVirtualTextEditors(): ReadonlyMap<string, TextEditorWithDecorations> {
    return this.uncoveredCodeRegionsVirtualTextEditors_;
  }

  // TODO: may be disposed of when tests will be exhaustive enough
  get uncoveredCodeRegionsDocumentProvider() {
    return this.textDocumentProvider;
  }

  // TODO: may be disposed of when tests will be exhaustive enough
  get decorationType() {
    return this.decorationType_;
  }

  private reportStartInOutputChannel() {
    this.outputChannel_.show(true);
    this.outputChannel_.clear();
    this.outputChannel_.appendLine(`starting ${Definitions.extensionDisplayName}`);
  }

  private buildVirtualDocumentUri() {
    return vscode.Uri.from({
      scheme: Definitions.extensionId,
      path: (<vscode.TextEditor>vscode.window.activeTextEditor).document.uri.path
    });
  }

  private addUncoveredCodeRegionsVirtualEditorIfNotExist(uri: vscode.Uri, doc: TextEditorWithDecorations) {
    if (!this.uncoveredCodeRegionsVirtualTextEditors_.has(uri.fsPath))
      this.uncoveredCodeRegionsVirtualTextEditors_.set(uri.fsPath, doc);
  }

  private readonly outputChannel_: vscode.OutputChannel;
  private readonly command: vscode.Disposable;
  private readonly textDocumentProvider: vscode.Disposable;
  private readonly uncoveredCodeRegionsVirtualTextEditors_: Map<string, TextEditorWithDecorations>;
  private readonly decorationType_: vscode.TextEditorDecorationType;
  private readonly decorationLocationsProvider: DecorationLocationsProvider;
}
