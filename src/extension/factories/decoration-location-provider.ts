import * as vscode from 'vscode';

import { DecorationLocationsProviderContract } from '../../domain/interfaces/decoration-locations-provider-contract';
import { DecorationLocationsProvider } from '../../domain/services/decoration-locations-provider';
import * as ErrorChannel from '../../domain/services/internal/error-channel';

import { ExecFileCallable } from '../../adapters/interfaces/process-control';
import { CreateReadStreamCallable, GlobSearchCallable, MkdirCallable, StatCallable } from '../../adapters/interfaces/file-system';

export function make(adapters: Adapters): DecorationLocationsProviderContract {
  return new DecorationLocationsProvider({
    workspace: vscode.workspace,
    stat: adapters.fileSystem.stat,
    execFileForCmakeCommand: adapters.processControl.execFileForCommand,
    execFileForCmakeTarget: adapters.processControl.execFileForTarget,
    globSearch: adapters.fileSystem.globSearch,
    mkdir: adapters.fileSystem.mkdir,
    createReadStream: adapters.fileSystem.createReadStream,
    progressReporter: adapters.vscode.progressReporter,
    errorChannel: adapters.vscode.errorChannel
  });
}

type Adapters = {
  vscode: {
    progressReporter: vscode.Progress<{ message?: string, increment?: number }>,
    errorChannel: ErrorChannel.OutputChannelLike
  },
  processControl: {
    execFileForCommand: ExecFileCallable,
    execFileForTarget: ExecFileCallable,
  },
  fileSystem: {
    stat: StatCallable,
    mkdir: MkdirCallable,
    globSearch: GlobSearchCallable,
    createReadStream: CreateReadStreamCallable
  }
};