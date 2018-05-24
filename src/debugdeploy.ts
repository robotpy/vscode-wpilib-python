'use strict';

import * as vscode from 'vscode';
import { ICodeDeployer, IDeployDebugAPI, IPreferencesAPI } from './externalapi';
import { PyPreferencesAPI } from './pypreferencesapi';

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
  public async runDeployer(_teamNumber: number, workspace: vscode.WorkspaceFolder): Promise<boolean> {
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

  constructor(preferences: IPreferencesAPI, pyPreferences: PyPreferencesAPI) {
    this.preferences = preferences;
    this.pyPreferences = pyPreferences;
  }

  public async getIsCurrentlyValid(workspace: vscode.WorkspaceFolder): Promise<boolean> {
    const prefs = this.preferences.getPreferences(workspace);
    const currentLanguage = prefs.getCurrentLanguage();
    return currentLanguage === 'none' || currentLanguage === 'java';
  }
  public async runDeployer(_teamNumber: number, workspace: vscode.WorkspaceFolder): Promise<boolean> {
    this.pyPreferences.getPreferences(workspace);
    return true;
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
  public async runDeployer(_: number, workspace: vscode.WorkspaceFolder): Promise<boolean> {
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

  constructor(debugDeployApi: IDeployDebugAPI, preferences: IPreferencesAPI, pyPreferences: PyPreferencesAPI , allowDebug: boolean) {
    debugDeployApi = debugDeployApi;
    debugDeployApi.addLanguageChoice('python');

    this.debugDeployer = new DebugCodeDeployer(preferences, pyPreferences);
    this.deployDeployer = new DeployCodeDeployer(preferences, pyPreferences);
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
