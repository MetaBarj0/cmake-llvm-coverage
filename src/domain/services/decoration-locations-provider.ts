import { VscodeWorkspaceLike } from './settings-provider';
import { StatFileLike, BuildTreeDirectoryResolver, FsLike } from './build-tree-directory-resolver';
import { Cmake, ProcessLike } from './cmake';
import { CoverageInfoFileResolver, GlobSearchLike } from './coverage-info-file-resolver';
import { LLVMCoverageInfoStreamBuilder, CoverageCollector } from './coverage-info-collector';

type Adapters = {
  workspace: VscodeWorkspaceLike,
  statFile: StatFileLike,
  processForCmakeCommand: ProcessLike,
  processForCmakeTarget: ProcessLike,
  globSearch: GlobSearchLike,
  fs: FsLike,
  llvmCoverageInfoStreamBuilder: LLVMCoverageInfoStreamBuilder
};

export class DecorationLocationsProvider {
  constructor(adapters: Adapters) {
    this.workspace = adapters.workspace;
    this.statFile = adapters.statFile;
    this.processForCmakeCommand = adapters.processForCmakeCommand;
    this.processForCmakeTarget = adapters.processForCmakeTarget;
    this.globSearch = adapters.globSearch;
    this.fs = adapters.fs;
    this.llvmCoverageInfoStreamBuilder = adapters.llvmCoverageInfoStreamBuilder;
  }

  async getDecorationLocationsForUncoveredCodeRegions(sourceFilePath: string) {
    const buildTreeDirectoryResolver = new BuildTreeDirectoryResolver({ workspace: this.workspace, statFile: this.statFile, fs: this.fs });
    await buildTreeDirectoryResolver.resolveBuildTreeDirectoryAbsolutePath();

    const cmake = new Cmake({
      workspace: this.workspace,
      processForCommand: this.processForCmakeCommand,
      processForTarget: this.processForCmakeTarget
    });

    await cmake.buildTarget();

    const coverageInfoFileResolver = new CoverageInfoFileResolver(this.workspace, this.globSearch);
    await coverageInfoFileResolver.resolveCoverageInfoFileFullPath();

    const collector = new CoverageCollector(this.llvmCoverageInfoStreamBuilder);

    return collector.collectFor(sourceFilePath);
  }

  private readonly workspace: VscodeWorkspaceLike;
  private readonly statFile: StatFileLike;
  private readonly processForCmakeCommand: ProcessLike;
  private readonly processForCmakeTarget: ProcessLike;
  private readonly globSearch: GlobSearchLike;
  private readonly fs: FsLike;
  private readonly llvmCoverageInfoStreamBuilder: LLVMCoverageInfoStreamBuilder;
}