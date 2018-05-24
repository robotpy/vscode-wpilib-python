'use strict';
import * as fs from 'fs';
import * as jsonc from 'jsonc-parser';
import * as mkdirp from 'mkdirp';
import * as ncp from 'ncp';
import * as path from 'path';
import * as vscode from 'vscode';
import { ICommandAPI, ICommandCreator, IPreferencesAPI } from './externalapi';
import { getClassName } from './utilities';

export interface IPythonJsonLayout {
  name: string;
  description: string;
  tags: string[];
  foldername: string;
  replacename: string;
}

function promisifyMkdirp(dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    mkdirp(dest, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function promisifyNcp(source: string, dest: string, options: ncp.Options = {}): Promise<void> {
  return promisifyMkdirp(dest).then(() => {
    return new Promise<void>((resolve, reject) => {
      ncp.ncp(source, dest, options, (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  });
}

async function performCopy(commandRoot: string, command: IPythonJsonLayout, folder: vscode.Uri, replaceName: string): Promise<boolean> {
  const commandFolder = path.join(commandRoot, command.foldername);
  const copiedFiles: string[] = [];
  await promisifyNcp(commandFolder, folder.fsPath, {
    filter: (cf: string): boolean => {
      if (fs.lstatSync(cf).isFile()) {
        copiedFiles.push(path.relative(commandFolder, cf));
      }
      return true;
    },
  });

  const promiseArray: Array<Promise<void>> = [];

  for (const f of copiedFiles) {
    const file = path.join(folder.fsPath, f);
    promiseArray.push(new Promise<void>((resolve, reject) => {
      fs.readFile(file, 'utf8', (err, dataIn) => {
        if (err) {
          reject(err);
        } else {
          const dataOut = dataIn.replace(new RegExp(command.replacename, 'g'), replaceName);
          fs.writeFile(file, dataOut, 'utf8', (err1) => {
            if (err1) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    }));
  }

  await Promise.all(promiseArray);

  const movePromiseArray: Array<Promise<void>> = [];
  for (const f of copiedFiles) {
    const file = path.join(folder.fsPath, f);
    const bname = path.basename(file);
    const dirname = path.dirname(file);
    if (path.basename(file).indexOf(command.replacename) > -1) {
      const newname = path.join(dirname, bname.replace(new RegExp(command.replacename, 'g'), replaceName));
      movePromiseArray.push(new Promise<void>((resolve, reject) => {
        fs.rename(file, newname, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }));
    }
  }

  if (movePromiseArray.length > 0) {
    await Promise.all(movePromiseArray);
  }

  return true;
}

export class Commands {
  private readonly commandResourceName = 'commands.json';

  constructor(resourceRoot: string, core: ICommandAPI, preferences: IPreferencesAPI) {
    const commandFolder = path.join(resourceRoot, 'src', 'commands');
    const resourceFile = path.join(commandFolder, this.commandResourceName);
    fs.readFile(resourceFile, 'utf8', (err, data) => {
      if (err) {
        console.log(err);
        return;
      }
      const commands: IPythonJsonLayout[] = jsonc.parse(data) as IPythonJsonLayout[];
      for (const c of commands) {
        const provider: ICommandCreator = {
          getLanguage(): string {
            return 'python';
          },
          getDescription(): string {
            return c.description;
          },
          getDisplayName(): string {
            return c.name;
          },
          async getIsCurrentlyValid(workspace: vscode.WorkspaceFolder): Promise<boolean> {
            const prefs = preferences.getPreferences(workspace);
            const currentLanguage = prefs.getCurrentLanguage();
            return currentLanguage === 'none' || currentLanguage === 'python';
          },
          async generate(folder: vscode.Uri): Promise<boolean> {
            const className = await getClassName();

            if (className === undefined || className === '') {
              return false;
            }
            return performCopy(commandFolder, c, folder, className);
          },
        };
        core.addCommandProvider(provider);
      }
    });
  }

  // tslint:disable-next-line:no-empty
  public dispose() {

  }
}
