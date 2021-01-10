import { TaskBase } from './taskBase';
import { CommonTasks } from './commonTasks';
import { TaskConfig } from './taskConfig';
import { TaskNpmPublish } from './taskNpmPublish';

export class CommonEntry extends TaskBase {
  task = '';
  constructor($task?: string) {
    super();
    if ($task !== null && $task !== undefined) {
      this.task = $task;
    } else {
      const task = this.getCommandArg('task', 'unknown');
      if (task === 'unknown') {
        throw new Error('task parameter is missing!');
      } else {
        this.task = task;
      }
    }
    this.execute();
  }

  private execute() {

    switch (this.task) {
      case 'printTime':
        new CommonTasks().printTime();
        break;
      case 'getConfig':
        new TaskConfig().getBuildConfiguration();
        break;
      case 'taskNpmPublish':
        new TaskNpmPublish();
        while (true) { }
        break;
    }
  }
}
