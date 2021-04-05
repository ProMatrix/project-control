import { ColoredLogger } from './coloredLogger';
import { AppSettings, ApiVersions, PackageJson } from '../../ngx-modelling';
import { CommandLine } from './commandLine';
import * as fs from 'fs-extra';

class BuildTime {
  exitAfterExecution = false;
  isDebuggingGulp = false;
}

class ProjectSettings {
  buildTime = new BuildTime();
}

export class CommonTasks {
  private cl = new ColoredLogger();
  private buildTime = new BuildTime();
  private cli = new CommandLine();
  private packageJsonPath = '';
  private appVersionsPath = '';

  setAppSettingsPath(appFolder: string) {
    this.packageJsonPath = appFolder + '\\package.json';
    this.appVersionsPath = appFolder + '\\libs\\essentials\\src\\resources\\libraries\\appversions.ts';
  }

  getProjectSettings(): ProjectSettings {
    const cwd = process.cwd();
    let projectSettings = fs.readFileSync(cwd + '/projectSettings.json').toString();
    if (projectSettings.charCodeAt(0) === 0xFEFF) {
      projectSettings = projectSettings.substring(1, projectSettings.length);
    }
    return JSON.parse(projectSettings);
  }

  setProjectSettings(projectSettings: ProjectSettings) {
    const cwd = process.cwd();
    const projectSettingsString = JSON.stringify(projectSettings, null, 2);
    fs.writeFileSync(cwd + '/projectSettings.json', projectSettingsString);
  }

  getPackageJson(): PackageJson {
    let packageJson = fs.readFileSync(this.packageJsonPath).toString();
    if (packageJson.charCodeAt(0) === 0xFEFF) {
      packageJson = packageJson.substring(1, packageJson.length);
    }
    return JSON.parse(packageJson);
  }

  setPackageJson($packageJson: PackageJson) {
    fs.writeFileSync(this.packageJsonPath, JSON.stringify($packageJson, null, 2));
  }

  getInstalledDependencies(apiVersions: ApiVersions) {
    let jsonString = fs.readFileSync(this.packageJsonPath).toString();
    if (jsonString.charCodeAt(0) === 0xFEFF) {
      jsonString = jsonString.substring(1, jsonString.length);
    }
    const dependencies = JSON.parse(jsonString).dependencies;
    apiVersions.rxJs = this.getDependency(dependencies, 'rxjs');
    apiVersions.moment = this.getDependency(dependencies, 'moment');
    apiVersions.coreJs = this.getDependency(dependencies, 'core-js');
    apiVersions.zoneJs = this.getDependency(dependencies, 'zone.js');
    apiVersions.googleMaps = this.getDependency(dependencies, '@types/google-maps');
    apiVersions.firebase = this.getDependency(dependencies, 'firebase');
    apiVersions.angularFire = this.getDependency(dependencies, '@angular/fire');
  }

  getInstalledDevDependencies(apiVersions: ApiVersions) {
    let jsonString = fs.readFileSync(this.packageJsonPath).toString();
    if (jsonString.charCodeAt(0) === 0xFEFF) {
      jsonString = jsonString.substring(1, jsonString.length);
    }
    const devDependencies = JSON.parse(jsonString).devDependencies;
    apiVersions.typeScript = this.getDependency(devDependencies, 'typescript');
  }

  getApiVersions(): ApiVersions {
    const apiVersions = new ApiVersions();
    this.getInstalledDependencies(apiVersions);
    this.getInstalledDevDependencies(apiVersions);
    return apiVersions;
  }

  setApiVersions(apiVersions: ApiVersions) {
    // changing a JavaScript object to a string equivalent
    if (!fs.existsSync(this.appVersionsPath)) {
      throw new Error('apiVersions file is missing!');
    }
    let apiVersionsString = this.objToString(apiVersions);
    let jsonString = JSON.stringify(apiVersions);
    apiVersionsString = apiVersionsString.split('class').join('const');
    apiVersionsString = apiVersionsString.split(' =').join(':');
    apiVersionsString = apiVersionsString.split(';').join(',');
    apiVersionsString = apiVersionsString.split('ApiVersions').join('apiVersions =');
    apiVersionsString += ';\n';
    fs.writeFileSync(this.appVersionsPath, apiVersionsString);
  }

  private getDependency(obj: object, key: string): string {
    let version = obj[key];
    if (!version) {
      return '';
    }
    version = version.replace('^', '');
    version = version.replace('~', '');
    return version;
  }

  // create a TypeScript class from an object
  objToString(obj: any): string {
    const objName = obj.constructor.name;
    const preString = 'export class ' + objName + ' {\n';
    let properties = '';
    for (const p in obj) {
      if (obj.hasOwnProperty(p)) {
        let value = '';
        if (obj[p]) {
          value = obj[p];
        }
        properties += '    ' + p + ' = \'' + value + '\';\n';
      }
    }
    const postString = '    }';
    return preString + properties + postString;
  }

  printTime() {
    const d = new Date();
    const t = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
    this.cl.printSuccess(`TIME: ${t}`);
  }

  removeDirectory(directory: string) {
    if (!fs.existsSync(directory)) {
      return;
    }
    fs.readdirSync(directory).forEach((i) => {
      const path = directory + '/' + i;
      if (fs.statSync(path).isDirectory()) {
        this.removeDirectory(path);
      } else {
        fs.unlinkSync(path);
      }
    });
    fs.rmdirSync(directory);
  }

  updateHref(htmlFile: string, fromHref: string, toHref: string) {
    const htmlFilePath = process.cwd() + '/' + htmlFile;
    let htmlFileString = fs.readFileSync(htmlFilePath).toString();
    htmlFileString = htmlFileString.replace(fromHref, toHref);
    fs.writeFileSync(process.cwd() + '/' + htmlFile, htmlFileString);
  }
}
