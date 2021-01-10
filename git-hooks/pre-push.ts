//import { TaskNpmPublish } from '../../project-control';


export class PrePush {

    constructor() {
      try {
       //const noop = new TaskNpmPublish(false, 'project-control', 'npm', '..\\..\\NgResources\\project-control', '.\\', '.\\', '..\\..\\Angular.Fire.Studio.11.00\\studio.app,..\\..\\Angular.Fire.Studio.11.00\\studio.test', '');
            // we can only see the console.log is the process.exit(1);
            
            // don't know if this works in VSCode
            //process.exit(1);
        } catch (e) {
            console.error(e.message);
            process.exit(1);
        }
    }
}
new PrePush();
