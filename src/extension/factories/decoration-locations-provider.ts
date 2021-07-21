import * as vscode from 'vscode';

import * as Definitions from '../definitions';
import * as SettingsProvider from '../../modules/settings-provider/implementations/settings-provider';
import * as BuildTreeDirectoryResolver from '../../modules/build-tree-directory-resolver/implementations/build-tree-directory-resolver';
import * as Cmake from '../../modules/cmake/implementations/cmake';
import * as CoverageInfoFileResolver from '../../modules/coverage-info-file-resolver/implementations/coverage-info-file-resolver';
import * as CoverageInfoCollector from '../../modules/coverage-info-collector/implementations/coverage-info-collector';
import * as DecorationLocationsProvider from '../../modules/decoration-locations-provider/implementations/decoration-locations-provider';
import * as fileSystem from '../../adapters/implementations/file-system';
import * as processControl from '../../adapters/implementations/process-control';

// TODO: fix progress feature as it does not work as expected anymore because of early return in this factory
export function make() {
  const errorChannel = vscode.window.createOutputChannel(Definitions.extensionId);;

  return vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Computing uncovered code region locations',
    cancellable: false
  }, async progressReporter => {

    const workspace = vscode.workspace;

    const settings = SettingsProvider.make({ workspace, errorChannel }).settings;
    const buildTreeDirectoryResolver = BuildTreeDirectoryResolver.make({
      errorChannel,
      progressReporter,
      settings,
      mkdir: fileSystem.mkdir,
      stat: fileSystem.stat
    });
    const cmake = Cmake.make({
      settings,
      execFile: processControl.execFile,
      errorChannel,
      progressReporter
    });
    const coverageInfoFileResolver = CoverageInfoFileResolver.make({
      errorChannel,
      globSearch: fileSystem.globSearch,
      progressReporter,
      settings
    });
    const coverageInfoCollector = CoverageInfoCollector.make({
      coverageInfoFileResolver,
      progressReporter,
      errorChannel,
      createReadStream: fileSystem.createReadStream
    });

    return DecorationLocationsProvider.make({
      settings,
      buildTreeDirectoryResolver,
      cmake,
      coverageInfoCollector
    });
  });
}