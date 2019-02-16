'use strict';

import * as vscode from 'vscode';
import { ICodeDeployer, IDeployDebugAPI, IPreferencesAPI } from 'vscode-wpilibapi';
import { PyExecutor } from './executor';
import { PyPreferencesAPI } from './pypreferencesapi';

function getCurrentFileIfPython(): string | undefined {
  const currentEditor = vscode.window.activeTextEditor;
  if (currentEditor === undefined) {
    return undefined;
  }
  if (currentEditor.document.fileName.endsWith('.py')) {
    return currentEditor.document.fileName;
  }
  return undefined;
}

class DebugCodeDeployer implements ICodeDeployer {
  private preferences: IPreferencesAPI;
  private pyPreferences: PyPreferencesAPI;

  constructor(preferences: IPreferencesAPI, pyPreferences: PyPreferencesAPI) {
    this.preferences = preferences;
    this.pyPreferences = pyPreferences;
  }

  public async getIsCurrentlyValid(workspace: vscode.WorkspaceFolder): Promise<boolean> {
    const prefs = this.preferences.getPreferences(workspace);
    const currentLanguage = prefs.getCurrentLanguage();
    return currentLanguage === 'none' || currentLanguage === 'python';
  }
  public async runDeployer(_teamNumber: number, workspace: vscode.WorkspaceFolder, _source: vscode.Uri | undefined): Promise<boolean> {
    this.pyPreferences.getPreferences(workspace);

    return true;
  }
  public getDisplayName(): string {
    return 'python';
  }
  public getDescription(): string {
    return 'Python Debugging';
  }
}

class DeployCodeDeployer implements ICodeDeployer {
  private preferences: IPreferencesAPI;
  private pyPreferences: PyPreferencesAPI;
  private pyExecutor: PyExecutor;

  constructor(preferences: IPreferencesAPI, pyPreferences: PyPreferencesAPI, pyExecutor: PyExecutor) {
    this.preferences = preferences;
    this.pyPreferences = pyPreferences;
    this.pyExecutor = pyExecutor;
  }

  public async getIsCurrentlyValid(workspace: vscode.WorkspaceFolder): Promise<boolean> {
    const prefs = this.preferences.getPreferences(workspace);
    const currentLanguage = prefs.getCurrentLanguage();
    return currentLanguage === 'none' || currentLanguage === 'python';
  }
  public async runDeployer(_teamNumber: number, workspace: vscode.WorkspaceFolder, source: vscode.Uri | undefined): Promise<boolean> {
    let file: string = '';
    if (source === undefined) {
      const cFile = getCurrentFileIfPython();
      if (cFile !== undefined) {
        file = cFile;
      } else {
        const mFile = await this.pyPreferences.getPreferences(workspace).getMainFile();
        if (mFile === undefined) {
          return false;
        }
        file = mFile;
      }
    } else {
      file = source.fsPath;
    }

    const prefs = this.preferences.getPreferences(workspace);

    const deploy = [file, 'deploy', `--team=${await prefs.getTeamNumber()}`];

    if (prefs.getSkipTests()) {
      deploy.push('--skip-tests');
    }

    const result = await this.pyExecutor.pythonRun(deploy, workspace.uri.fsPath, workspace, 'Python Deploy');

    return result === 0;
  }
  public getDisplayName(): string {
    return 'python';
  }
  public getDescription(): string {
    return 'Python Deploy';
  }
}

class SimulateCodeDeployer implements ICodeDeployer {
  private preferences: IPreferencesAPI;
  private pyPreferences: PyPreferencesAPI;

  constructor(preferences: IPreferencesAPI, pyPreferences: PyPreferencesAPI) {
    this.preferences = preferences;
    this.pyPreferences = pyPreferences;
  }

  public async getIsCurrentlyValid(workspace: vscode.WorkspaceFolder): Promise<boolean> {
    const prefs = this.preferences.getPreferences(workspace);
    const currentLanguage = prefs.getCurrentLanguage();
    return currentLanguage === 'none' || currentLanguage === 'python';
  }
  public async runDeployer(_: number, workspace: vscode.WorkspaceFolder, _source: vscode.Uri | undefined): Promise<boolean> {
    this.pyPreferences.getPreferences(workspace);
    return true;
  }
  public getDisplayName(): string {
    return 'python';
  }
  public getDescription(): string {
    return 'Python Simulation';
  }
}

export class DebugDeploy {
  private debugDeployer: DebugCodeDeployer;
  private deployDeployer: DeployCodeDeployer;
  private simulator: SimulateCodeDeployer;

  constructor(
    debugDeployApi: IDeployDebugAPI,
    preferences: IPreferencesAPI,
    pyPreferences: PyPreferencesAPI,
    pyExecutor: PyExecutor,
    allowDebug: boolean,
  ) {
    debugDeployApi.addLanguageChoice('python');

    this.debugDeployer = new DebugCodeDeployer(preferences, pyPreferences);
    this.deployDeployer = new DeployCodeDeployer(preferences, pyPreferences, pyExecutor);
    this.simulator = new SimulateCodeDeployer(preferences, pyPreferences);

    debugDeployApi.registerCodeDeploy(this.deployDeployer);

    if (allowDebug) {
      debugDeployApi.registerCodeDebug(this.debugDeployer);
      debugDeployApi.registerCodeSimulate(this.simulator);
    }
  }

  // tslint:disable-next-line:no-empty
  public dispose() {

  }
}
