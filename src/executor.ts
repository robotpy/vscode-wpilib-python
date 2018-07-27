'use strict';
import * as child_process from 'child_process';
import * as vscode from 'vscode';

const outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel('python');

export function executeCommandAsync(command: string, args: string[], rootDir: string, ow?: vscode.OutputChannel): Promise<number> {
  return new Promise((resolve, _) => {
    const spawn = child_process.spawn;
    const child = spawn(command, args, {
      cwd: rootDir,
    });

    child.on('exit', (err) => {
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

export async function pythonRun(args: string[], rootDir: string, _workspace: vscode.WorkspaceFolder, _name: string): Promise<number> {
  const configuration = vscode.workspace.getConfiguration();
  const interpreter: string = configuration.get('python.pythonPath') || 'python';

  outputChannel.clear();
  outputChannel.show();
  return executeCommandAsync(interpreter, args, rootDir, outputChannel);
}
