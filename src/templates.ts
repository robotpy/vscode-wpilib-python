'use strict';
import * as fs from 'fs';
import * as jsonc from 'jsonc-parser';
import * as path from 'path';
import * as vscode from 'vscode';
import { IExampleTemplateAPI, IExampleTemplateCreator } from 'vscode-wpilibapi';

export interface ITemplateJsonLayout {
  name: string;
  description: string;
  tags: string[];
  foldername: string;
  gradlebase: string;
}

export class Templates {
  private readonly exampleResourceName = 'templates.json';

  constructor(resourceRoot: string, core: IExampleTemplateAPI) {
    const templatesFolder = path.join(resourceRoot, 'src', 'templates');
    const resourceFile = path.join(templatesFolder, this.exampleResourceName);
    fs.readFile(resourceFile, 'utf8', (err, data) => {
      if (err) {
        console.log(err);
        return;
      }
      const templates: ITemplateJsonLayout[] = jsonc.parse(data) as ITemplateJsonLayout[];
      for (const e of templates) {
        const provider: IExampleTemplateCreator = {
          getLanguage(): string {
            return 'python';
          },
          getDescription(): string {
            return e.description;
          },
          getDisplayName(): string {
            return e.name;
          },
          async generate(_folderInto: vscode.Uri): Promise<boolean> {
            try {
              console.log('todo');
            } catch (err) {
              console.log(err);
              return false;
            }
            return true;
          },
        };
        core.addTemplateProvider(provider);
      }
    });
  }

  // tslint:disable-next-line:no-empty
  public dispose() {

  }
}
