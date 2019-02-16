'use strict';

import * as vscode from 'vscode';

export class PromiseCondition<T> {
  private hasBeenSet: boolean = false;
  private value?: T;
  private condSet?: ((value: T) => void);

  public wait(): Promise<T> {
    return new Promise((resolve, _) => {
      this.condSet = resolve;
      if (this.hasBeenSet === true) {
        resolve(this.value);
      }
    });
  }

  public set(value: T) {
    this.value = value;
    this.hasBeenSet = true;
    if (this.condSet !== undefined) {
      this.condSet(value);
    }
  }
}

export class PyExecutor {
  private runners = new Map<vscode.TaskExecution, PromiseCondition<number>>();

  public constructor() {
    vscode.tasks.onDidEndTaskProcess((e) => {
      const cond = this.runners.get(e.execution);
      if (cond !== undefined) {
        cond.set(e.exitCode);
        this.runners.delete(e.execution);
      }
    });
  }

  public async runCommand(command: string, args: string[], rootDir: string, workspace: vscode.WorkspaceFolder, name: string): Promise<number> {
    const process = new vscode.ProcessExecution(command, args, {
      cwd: rootDir,
    });
    const task = new vscode.Task({ type: 'wpilibpython' }, workspace, name, 'wpilib', process);
    const execution = await vscode.tasks.executeTask(task);
    const condition = new PromiseCondition<number>();
    this.runners.set(execution, condition);
    return condition.wait();
  }

  public async pythonRun(args: string[], rootDir: string, workspace: vscode.WorkspaceFolder, name: string): Promise<number> {
    const configuration = vscode.workspace.getConfiguration('python', workspace.uri);
    const interpreter: string = configuration.get('pythonPath', 'python');

    return this.runCommand(interpreter, args, rootDir, workspace, name);
  }
}
