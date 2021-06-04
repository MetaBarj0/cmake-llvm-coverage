import * as chai from 'chai';
import { describe, it } from 'mocha';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
chai.should();

import { extensionName } from '../../../src/extension-name';
import { BuildTreeDirectoryResolver } from '../../../src/domain/services/build-tree-directory-resolver';
import { SettingsProvider } from '../../../src/domain/services/settings-provider';

import { statFile as sf, fs, workspace as w } from '../../builders/fake-adapters';

import path = require('path');

describe('the build tree directory resolver behavior regarding the build tree directory setting value', () => {
  it('should fail to resolve when the build tree directory setting look like an absolute path', () => {
    const workspace = w.buildFakeWorkspaceWithWorkspaceFolderAndOverridableDefaultSettings({
      buildTreeDirectory: path.normalize('/absolute/build')
    });

    const statFile = sf.buildFakeFailingStatFile();
    const failingFs = fs.buildFakeFailingFs();

    const resolver = new BuildTreeDirectoryResolver({ workspace, statFile, fs: failingFs });

    return resolver.resolveBuildTreeDirectoryAbsolutePath().should.eventually.be.rejectedWith(
      `Incorrect absolute path specified in '${extensionName}: Build Tree Directory'. It must be a relative path.`);
  });

  it('should fail to resolve if specified relative path target does not exist and cannot be created', () => {
    const workspace = w.buildFakeWorkspaceWithWorkspaceFolderAndOverridableDefaultSettings();
    const statFile = sf.buildFakeFailingStatFile();
    const failingFs = fs.buildFakeFailingFs();

    const resolver = new BuildTreeDirectoryResolver({ workspace, statFile, fs: failingFs });

    return resolver.resolveBuildTreeDirectoryAbsolutePath().should.eventually.be.rejectedWith(
      'Cannot find or create the build tree directory. Ensure the ' +
      `'${extensionName}: Build Tree Directory' setting is a valid relative path.`);
  });

  it('should resolve the full path of the build tree directory if the specified setting target an existing directory', () => {
    const workspace = w.buildFakeWorkspaceWithWorkspaceFolderAndOverridableDefaultSettings();
    const settings = new SettingsProvider(workspace).settings;
    const statFile = sf.buildFakeSucceedingStatFile();
    const failingFs = fs.buildFakeFailingFs();

    const resolver = new BuildTreeDirectoryResolver({ workspace, statFile, fs: failingFs });

    return resolver.resolveBuildTreeDirectoryAbsolutePath().should.eventually.be.equal(
      `${path.join(settings.rootDirectory, settings.buildTreeDirectory)}`);
  });

  it('should resolve the full path of the build tree directory if the specified setting target ' +
    'an unexisting directory that can be created', () => {
      const workspace = w.buildFakeWorkspaceWithWorkspaceFolderAndOverridableDefaultSettings();
      const settings = new SettingsProvider(workspace).settings;
      const statFile = sf.buildFakeFailingStatFile();
      const succeedingFs = fs.buildFakeSucceedingFs();

      const resolver = new BuildTreeDirectoryResolver({ workspace, statFile, fs: succeedingFs });

      return resolver.resolveBuildTreeDirectoryAbsolutePath().should.eventually.be.equal(
        `${path.join(settings.rootDirectory, settings.buildTreeDirectory)}`);
    });
});
