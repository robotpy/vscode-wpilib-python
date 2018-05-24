'use strict';
import * as child_process from 'child_process';
import * as vscode from 'vscode';

const outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel('python');

export function executeCommandAsync(command: string, rootDir: string, ow?: vscode.OutputChannel): Promise<number> {
  return new Promise((resolve, _) => {
    const exec = child_process.exec;
    const child = exec(command, {
      cwd: rootDir,
    }, (err) => {
      if (err) {
        resolve(1);
      } else {
        resolve(0);
      }
    });

    if (ow === undefined) {
      return;
    }

    child.stdout.on('data', (data) => {
      ow.append(data.toString());
    });

    child.stderr.on('data', (data) => {
      ow.append(data.toString());
    });
  });
}

export async function pythonRun(args: string, rootDir: string, _workspace: vscode.WorkspaceFolder, _name: string): Promise<number> {
  const command = 'python ' + args;

  outputChannel.clear();
  outputChannel.show();
  return executeCommandAsync(command, rootDir, outputChannel);
}
