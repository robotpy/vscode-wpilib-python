'use strict';

import * as vscode from 'vscode';
import { IBuildTestAPI, IPreferencesAPI } from './externalapi';
import { PyPreferencesAPI } from './pypreferencesapi';

export class BuildTest {
  constructor(buildTestApi: IBuildTestAPI, preferences: IPreferencesAPI, pyPreferences: PyPreferencesAPI) {
    buildTestApi.addLanguageChoice('java');

    buildTestApi.registerCodeBuild({
      async getIsCurrentlyValid(workspace: vscode.WorkspaceFolder): Promise<boolean> {
        const prefs = preferences.getPreferences(workspace);
        const currentLanguage = prefs.getCurrentLanguage();
        return currentLanguage === 'none' || currentLanguage === 'python';
      },
      async runBuilder(workspace: vscode.WorkspaceFolder): Promise<boolean> {
        pyPreferences.getPreferences(workspace);
        await vscode.window.showInformationMessage('You\'re in python, no need to build.');
        return true;
      },
      getDisplayName(): string {
        return 'python';
      },
      getDescription(): string {
        return 'Python Build';
      },
    });

    buildTestApi.registerCodeTest({
      async getIsCurrentlyValid(workspace: vscode.WorkspaceFolder): Promise<boolean> {
        const prefs = preferences.getPreferences(workspace);
        const currentLanguage = prefs.getCurrentLanguage();
        return currentLanguage === 'none' || currentLanguage === 'python';
      },
      async runBuilder(_: vscode.WorkspaceFolder): Promise<boolean> {
        await vscode.window.showInformationMessage('Work in progress.');
        return true;
      },
      getDisplayName(): string {
        return 'python';
      },
      getDescription(): string {
        return 'Python Test';
      },
    });
  }

  // tslint:disable-next-line:no-empty
  public dispose() {

  }
}
