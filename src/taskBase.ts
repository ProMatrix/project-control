import { ColoredLogger } from './coloredLogger';
import { Versioning } from './versioning';
import { CommonTasks } from './commonTasks';
import { ProductionReady } from './productionReady';
import { DeveloperSettings, VisualProject, BuildConfiguration, AngularProject, NgWorkspace } from '../../ngx-modelling';
import { CommandLine } from './commandLine';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as glob from 'glob';

export class TaskBase {
  readonly cli = new CommandLine();
  readonly cl = new ColoredLogger();
  readonly ver = new Versioning();
  readonly pr = new ProductionReady();
  readonly ct = new CommonTasks();

  waitOnCompleted = false;

  angularProject = '';
  chromeExtension = '';
  developersSettingsPath = '';
  synchronous = false;
  cwd = '';

  // TODO remove later
  visualProject = '';

  // TODO remove later
  updateReleaseHtml(visualProject: VisualProject) {
    const pathToReleaseTemplate = process.cwd() + "\\" + visualProject.name + "\\wwwroot\\dist\\release.template.html";
    const pathToReleaseHtml = process.cwd() + "\\" + visualProject.name + "\\wwwroot\\dist\\release.html";
    let releaseHtmlString = fs.readFileSync(pathToReleaseTemplate).toString();
    releaseHtmlString = releaseHtmlString.replace(/dist-template/g, visualProject.developerSettings.serveApp);
    fs.writeFileSync(pathToReleaseHtml, releaseHtmlString);
  }

  // deprecate
  getDevelopersSettings(visualProject: string): Array<DeveloperSettings> {
    const developersettingsPath = process.cwd() + '\\' + visualProject + '\\developersSettings.json';
    const developersSettings = JSON.parse(fs.readFileSync(developersettingsPath).toString()) as Array<DeveloperSettings>;
    return developersSettings;
  }

  saveDeveloperSettings(ds: DeveloperSettings) {
    // allow for an array of developerSettings for more than 1 developer
    let dss = new Array<DeveloperSettings>();
    dss.push(ds);
    fs.writeFileSync(this.developersSettingsPath, JSON.stringify(dss, null, 2));
  }

  saveDevelopersSettings(visualProject: string, developersSettings: Array<DeveloperSettings>) {
    const developersettingsPath = process.cwd() + '\\' + visualProject + '\\developersSettings.json';
    fs.writeFileSync(developersettingsPath, JSON.stringify(developersSettings, null, 2));
  }

  getAngularJson(visualProject: string): any {
    const angularJsonPath = process.cwd() + '\\' + visualProject + '\\wwwroot\\angular.json';
    const angularJson = JSON.parse(fs.readFileSync(angularJsonPath).toString());
    return angularJson;
  }

  saveAngularJson(visualProject: string, angularJson: any) {
    const angularJsonPath = process.cwd() + '\\' + visualProject + '\\wwwroot\\angular.json';
    fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));
  }

  getPackageJson(visualProject: string): any {
    const packageJsonPath = process.cwd() + '\\' + visualProject + '\\wwwroot\\package.json';
    const packageJsonString = fs.readFileSync(packageJsonPath).toString();
    const packageJson = JSON.parse(packageJsonString);
    return packageJson;
  }

  savePackageJson(visualProject: string, packageJson: any) {
    const packageJsonPath = process.cwd() + '\\' + visualProject + '\\wwwroot\\package.json';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  getDeveloperSettings(): DeveloperSettings | null {
    const developersSettings = JSON.parse(fs.readFileSync(this.developersSettingsPath).toString()) as Array<DeveloperSettings>;
    let developerSettings = developersSettings.find(x => (x.machineName === os.hostname()));

    if (!developerSettings) {
      developerSettings = developersSettings.find(x => (x.machineName === 'ANONYMOUS DEVELOPERS MACHINE NAME'));
    }
    if (!developerSettings) {
      return null;
    }
    return developerSettings;
  }

  getNgWorkspace(): NgWorkspace {
    if (!fs.existsSync(this.developersSettingsPath)) {
      return new NgWorkspace();
    }
    const ds = this.getDeveloperSettings();
    if (!ds) {
      return new NgWorkspace();
    }
    const ngWorkspacePath = ds.appFolder + '\\angular.json';
    if (!fs.existsSync(ngWorkspacePath)) {
      return new NgWorkspace();
    }

    const s = fs.readFileSync(ngWorkspacePath);
    const ngWorkspace = JSON.parse(fs.readFileSync(ngWorkspacePath).toString()) as NgWorkspace;
    if (ngWorkspace) {
      return ngWorkspace;
    } else {
      return new NgWorkspace();
    }
  }

  getBuildConfiguration(): BuildConfiguration {
    if (!fs.existsSync(this.developersSettingsPath)) {
      return new BuildConfiguration();
    }

    const bc: BuildConfiguration = { machineName: os.hostname(), visualProject: new VisualProject() };
    const developersSettings = JSON.parse(fs.readFileSync(this.developersSettingsPath).toString()) as Array<DeveloperSettings>;
    const developerSettings = this.getDeveloperSettings();

    if (developerSettings) {
      let developerSettingsPath = process.cwd();
      if (developerSettingsPath.indexOf('\\') !== -1) {
        developerSettingsPath = developerSettingsPath.substr(0, developerSettingsPath.lastIndexOf('\\'));
      } else { // MacOs
        developerSettingsPath = developerSettingsPath.substr(0, developerSettingsPath.lastIndexOf('/'));
      }
      bc.visualProject = {
        developerSettingsPath,
        developerSettings,
        showPanel: false,
        showVersion: true
      }
    }
    return bc;
  }

  findValueOf(arg: string): string {
    try {
      return process.argv.filter(x => x.indexOf(arg) !== -1)[0].split('=')[1];
    } catch (e) {
      return '';
    }
  }

  getCommandArg(arg: string, defaultString: string): string {
    try {
      return process.argv.filter(x => x.indexOf(arg + '=') !== -1)[0].split('=')[1];
    } catch (e) {
      return defaultString;
    }
  }

  getCurrentBranch(): string {
    let currentBranch = this.cli.executeSync('git branch');
    currentBranch = currentBranch.substr(currentBranch.indexOf('*') + 2);
    let delimiterIndex = currentBranch.indexOf(' ');
    if (delimiterIndex === -1) {
      delimiterIndex = currentBranch.indexOf('\n');
    }
    currentBranch = currentBranch.substr(0, delimiterIndex);
    return currentBranch;
  }

  getNpmVersionNo(npmPackage: string): string {

    let versionOnNpm = this.cli.executeSync('npm info ' + npmPackage + ' version');
    if (versionOnNpm.length > 0) {
      let delimiterIndex = versionOnNpm.length - 1;
      versionOnNpm = versionOnNpm.substr(0, versionOnNpm.length - 1);
    }
    return versionOnNpm;
  }

  getLocalVersionNo(npmPackage: string): string {
    let versionOnNpm = this.cli.executeSync('npm show ' + npmPackage + ' version');
    if (versionOnNpm.length > 0) {
      let delimiterIndex = versionOnNpm.length - 1;
      versionOnNpm = versionOnNpm.substr(0, versionOnNpm.length - 1);
    }
    return versionOnNpm;
  }

  getChangedFiles(): Array<string> {
    // this is determined by the cwd
    const cf = this.cli.executeSync('git diff --name-only');
    const changedFiles = cf.split('\n');
    changedFiles.pop();
    changedFiles.forEach((changedFile) => {
      changedFile = changedFile.replace('\n', '');
    });
    return changedFiles;
  }

  commitStagedChanges(commitMessage: string): string {
    return this.cli.executeSync('git commit -m "' + commitMessage + '"');
  }

  undoAllLocalChanges(): string {
    // Very dangerous, because this will undo all changes for all Git repos
    return this.cli.executeSync('git reset --hard');
  }

  undoLocalChangedFile(changedFile: string): string {
    return this.cli.executeSync('git checkout -- ' + changedFile);
  }

  dumpString(str: string) {
    for (let i = 0; i < str.length; i++) {
      let ascii = str.charCodeAt(i);
      console.log(ascii);
    }
  }
}
