import { TaskBase } from './taskBase';
import { BuildConfiguration, PackageJson } from '../../ngx-modelling';
import * as fs from 'fs-extra';

export class TaskConfig extends TaskBase {
  bc: BuildConfiguration;
  constructor($waitOnCompleted?: boolean, $visualProject?: string, $developersSettingsPath?: string) {
    super();
    if ($waitOnCompleted != null) { // null or undefined
      this.waitOnCompleted = $waitOnCompleted;
    } else {
      const waitOnCompleted = this.getCommandArg('waitOnCompleted', 'true');
      if (waitOnCompleted === 'true') {
        this.waitOnCompleted = true;
      } else {
        this.waitOnCompleted = false;
      }
    }

    if ($visualProject != null) {
      this.visualProject = $visualProject;
    } else {
      const visualProject = this.getCommandArg('visualProject', 'unknown');
      if (visualProject === 'unknown') {
        throw new Error('visualProject parameter is missing!');
      } else {
        this.visualProject = visualProject;
      }
    }

    if ($developersSettingsPath != null) {
      this.developersSettingsPath = $developersSettingsPath;
    } else {
      const developersSettingsPath = this.getCommandArg('developersSettingsPath', 'unknown');
      if (developersSettingsPath === 'unknown') {
        throw new Error('developersSettingsPath parameter is missing!');
      } else {
        this.developersSettingsPath = developersSettingsPath;
      }
    }

    this.bc = this.getBuildConfiguration();
    if (this.waitOnCompleted) {
      while (true) { }
    }
  }

  getBuildVersion(): PackageJson {
    let packageJsonString = fs.readFileSync(this.bc.visualProject.developerSettings.appFolder + '\\package.json').toString();
    if (packageJsonString.charCodeAt(0) === 0xFEFF) {
      packageJsonString = packageJsonString.substring(1, packageJsonString.length);
    }
    return JSON.parse(packageJsonString) as PackageJson;
  }
  
}
