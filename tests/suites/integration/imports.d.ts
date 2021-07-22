import * as RegionCoverageInfoModule from "../../../src/modules/abstractions/region-coverage-info";
import * as AbstractVscodeModule from "../../../src/adapters/abstractions/vscode";
import { Settings as AbstractSettings } from "../../../src/modules/abstractions/settings";

export namespace Domain {
  export namespace Abstractions {
    export type RegionCoverageInfo = RegionCoverageInfoModule.RegionCoverageInfo;
    export type Settings = AbstractSettings;
  }
}

export namespace Adapters {
  export namespace Abstractions {
    export namespace vscode {
      export type VscodeWorkspaceFolderLike = AbstractVscodeModule.VscodeWorkspaceFolderLike;
    }
  }
}