import { defaultSetting } from "../../utils/settings";

import { Settings } from "../../../src/modules/abstractions/settings";
import {
  DisposableLike,
  TextDocumentContentProviderLike,
  VscodeUriLike,
  VscodeWorkspaceConfigurationLike,
  VscodeWorkspaceFolderLike, VscodeWorkspaceLike
} from "../../../src/adapters/abstractions/vscode";

import { OutputChannelLike, ProgressLike, ProgressStep } from "../../../src/adapters/abstractions/vscode";

import { Spy } from "../../utils/spy";

type Overrides = {
  -readonly [Property in keyof Settings]?: Settings[Property]
};

export function buildFakeWorkspaceWithWorkspaceFolderAndOverridableDefaultSettings(overrides: Overrides = {}): VscodeWorkspaceLike {
  return new class implements VscodeWorkspaceLike {
    constructor(overrides: Overrides) {
      this.overrides = overrides;
    }

    registerTextDocumentContentProvider(_scheme: string, _provider: TextDocumentContentProviderLike): DisposableLike {
      throw new Error("Method not implemented.");
    }

    workspaceFolders = [
      new class implements VscodeWorkspaceFolderLike {
        uri = new class implements VscodeUriLike {
          fsPath = defaultSetting("rootDirectory").toString();
        };
      }];

    getConfiguration(_section?: string) {
      return new class implements VscodeWorkspaceConfigurationLike {
        constructor(overrides: Overrides) {
          this.overrides = overrides;
        }

        get(section: keyof Settings) {
          if (this.overrides[section])
            return <Settings[typeof section]>this.overrides[section];

          return defaultSetting(section);
        }

        async update(_section: string, _value: unknown) { }

        private overrides: Overrides;
      }(this.overrides);
    }

    private overrides: Overrides;
  }(overrides);
}

export function buildFakeWorkspaceWithoutWorkspaceFolderAndWithoutSettings(): VscodeWorkspaceLike {
  return new class implements VscodeWorkspaceLike {

    registerTextDocumentContentProvider(_scheme: string, _provider: TextDocumentContentProviderLike): DisposableLike {
      throw new Error("Method not implemented.");
    }
    workspaceFolders = undefined;

    getConfiguration(_section?: string) {
      return new class implements VscodeWorkspaceConfigurationLike {
        get(section: keyof Settings) {
          return defaultSetting(section);
        }

        async update(_section: string, _value: unknown) { }
      };
    }
  };
}

export function buildFakeOutputChannel(): OutputChannelLike {
  return new class implements OutputChannelLike {
    appendLine(_line: string) { }
  };
}

export function buildSpyOfOutputChannel(outputChannel: OutputChannelLike): Spy<OutputChannelLike> {
  return new class extends Spy<OutputChannelLike> implements OutputChannelLike {
    constructor(outputChannel: OutputChannelLike) {
      super(outputChannel);
    }

    appendLine(line: string) {
      this.wrapped.appendLine(line);
      this.incrementCallCountFor("appendLine");
    }

    get object() {
      return this;
    }
  }(outputChannel);
}

export function buildFakeProgressReporter(): ProgressLike {

  return new class implements ProgressLike {
    report(_value: ProgressStep) { }
  };
}

export function buildSpyOfProgressReporter(progressReporter: ProgressLike): Spy<ProgressLike> {
  return new class extends Spy<ProgressLike> implements ProgressLike {
    constructor(progressReporter: ProgressLike) {
      super(progressReporter);
    }

    report(value: ProgressStep) {
      this.wrapped.report(value);
      super.incrementCallCountFor("report");
    }

    get object() {
      return this;
    }
  }(progressReporter);
}
