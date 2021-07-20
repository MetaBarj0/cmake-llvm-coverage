import { TextEditor, TextEditorDecorationType } from 'vscode';

type Decorations = {
  decorationType: TextEditorDecorationType
};

type WithDecorations = {
  get decorations(): Decorations | undefined;
};

export type TextEditorWithDecorations = TextEditor & WithDecorations;
