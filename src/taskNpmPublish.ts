import * as fs from 'fs-extra';
import { TaskBase } from './taskBase';

export class TaskNpmPublish extends TaskBase {
  private npmPackage: string; // package to publish
  private branch: string; // branch to publish
  private gitFolder: string; // local git repo
  private gitPath: string; // local git path
  private libFolder: string; // library folder
  private libPath: string; // library path
  private pubFolder: string; // publish folder
  private pubPath: string; // publish path
  private workspaces: string; // workspaces using library
  private entryPath: string; // entry cwd
  private scriptName: string; // npm script to run after build
  private testOnly: boolean; // set to true will only test the build process

  constructor($testOnly?: boolean, $npmPackage?: string, $branch?: string, $gitFolder?: string, $libFolder?: string, $pubFolder?: string, $workspaces?: string, $scriptName?: string) {
    super();
    if ($testOnly !== null && $testOnly !== undefined) {
      this.testOnly = $testOnly;
    } else {
      const testOnly = this.getCommandArg('testOnly', 'true');
      if (testOnly === 'true') {
        this.testOnly = true;
      } else {
        this.testOnly = false;
      }
    }

    if ($npmPackage !== null && $npmPackage !== undefined) {
      this.npmPackage = $npmPackage;
    } else {
      const npmPackage = this.getCommandArg('npmPackage', 'unknown');
      if (npmPackage === 'unknown') {
        throw new Error(`npmPackage parameter is missing!`);
      } else {
        this.npmPackage = npmPackage;
      }
    }

    if ($branch !== null && $branch !== undefined) {
      this.branch = $branch;
    } else {
      const branch = this.getCommandArg('branch', 'unknown');
      if (branch === 'unknown') {
        throw new Error(`branch parameter is missing!`);
      } else {
        this.branch = branch;
      }
    }

    if ($gitFolder !== null && $gitFolder !== undefined) {
      this.gitFolder = $gitFolder;
    } else {
      const gitFolder = this.getCommandArg('gitFolder', 'unknown');
      if (gitFolder === 'unknown') {
        throw new Error(`gitFolder parameter is missing!`);
      } else {
        this.gitFolder = gitFolder;
      }
    }

    if ($libFolder !== null && $libFolder !== undefined) {
      this.libFolder = $libFolder;
    } else {
      const libFolder = this.getCommandArg('libFolder', 'unknown');
      if (libFolder === 'unknown') {
        throw new Error(`libFolder parameter is missing!`);
      } else {
        this.libFolder = libFolder;
      }
    }

    if ($pubFolder !== null && $pubFolder !== undefined) {
      this.pubFolder = $pubFolder;
    } else {
      const pubFolder = this.getCommandArg('pubFolder', 'unknown');
      if (pubFolder === 'unknown') {
        throw new Error(`pubFolder parameter is missing!`);
      } else {
        this.pubFolder = pubFolder;
      }
    }

    if ($workspaces !== null && $workspaces !== undefined) {
      this.workspaces = $workspaces;
    } else {
      const workspaces = this.getCommandArg('workspaces', 'unknown');
      if (workspaces === 'unknown') {
        throw new Error(`workspaces parameter is missing!`);
      } else {
        this.workspaces = workspaces;
      }
    }

    if ($scriptName !== null && $scriptName !== undefined) {
      this.scriptName = $scriptName;
    } else {
      const scriptName = this.getCommandArg('scriptName', 'unknown');
      if (scriptName === 'unknown') {
        throw new Error(`scriptName parameter is missing!`);
      } else {
        this.scriptName = scriptName;
      }
    }
    this.entryPath = process.cwd();
    process.chdir(this.gitFolder);
    this.gitPath = process.cwd();
    process.chdir(this.libFolder);
    this.libPath = process.cwd();
    if (!fs.existsSync(this.pubFolder)) {
      fs.mkdirSync(this.pubFolder);
    }
    process.chdir(this.pubFolder);
    this.pubPath = process.cwd();
    process.chdir(this.gitPath);
    if (this.testOnly) {
      this.testPackaging(); // this method only tests the packaging
    } else {
      this.execute(); // this method does everything packaging, publishing and updating
    }
    process.exit(0);
  }

  testPackaging() {
    process.chdir(this.libPath);
    // run packaging script
    if (this.scriptName.length > 0) {
      console.log(`test packaging started!`);
      this.cli.executeSync(`npm run ${this.scriptName}`);
      console.log('test packaging completed!');
    }
  }

  execute() {
    let currentBranch = this.getCurrentBranch();
    if (currentBranch !== this.branch) {
      console.log(`cannot publish from the branch: ${currentBranch}`);
      return;
    }
    // let outgoingCommits = this.cli.executeSync('git log origin/' + this.branch + '..' + this.branch);
    let outgoingCommits = this.cli.executeSync(`git log origin/${this.branch}..${this.branch}`);
    if (outgoingCommits.length > 0) {

      // any outgoingCommits into the this.branch will publish to npm
      process.chdir(this.libPath);

      // get the latest version from npm, and update local package version no.
      const versionOnNpm1 = this.getNpmVersionNo(this.npmPackage);
      console.log(`${this.npmPackage} - current npm version: ${versionOnNpm1}`);

      // update libPath version to what is on npm
      this.cli.executeSync(`npm version ${versionOnNpm1} --allow-same-version --no-git-tag-version`);

      // run packaging script
      if (this.scriptName.length > 0) {
        process.chdir(this.libPath)
        console.log(`begin running packaging script: ${this.scriptName}`);
        this.cli.executeSync(`npm run ${this.scriptName}`);
      }
      process.chdir(this.pubPath);
      // update pubPath version to what is on npm
      this.cli.executeSync(`npm version ${versionOnNpm1} --allow-same-version --no-git-tag-version`);

      // patch the version from what is on npm
      this.cli.executeSync(`npm version patch --no-git-tag-version`);

      console.log(`begin publish of: ${this.npmPackage}`);

      this.cli.executeSync(`npm publish`);

      const versionOnNpm2 = this.getNpmVersionNo(this.npmPackage);
      console.log(`${this.npmPackage} - new npm version: ${versionOnNpm2}`);

      process.chdir(this.gitPath);
      // Undo all files that changed during the build process (package.json)
      // By undoing these files, we will be able to change to another branch
      const changedFiles = this.getChangedFiles();
      changedFiles.forEach((changedFile) => {
        console.log(`undo a change, and making life simpler: ${changedFile}`);
        this.undoLocalChangedFile(changedFile);
      });

      // reinstall the package on all the Angular workspace that use the this.npmPackage
      const workspaceArray = this.workspaces.split(',');
      workspaceArray.forEach((workspace) => {
        process.chdir(this.entryPath);
        console.log(`process.cwd(): ${process.cwd()}`);

        if (fs.existsSync(workspace)) {
          console.log(`re-install ${this.npmPackage} for: ${workspace}`);
          process.chdir(workspace);
          this.cli.executeSync(`npm uninstall ${this.npmPackage} --save`);
          this.cli.executeSync(`npm install ${this.npmPackage} --save`);

          const localVersion = this.getLocalVersionNo(this.npmPackage);
          const versionOnNpm3 = this.getNpmVersionNo(this.npmPackage);

          console.log(`${this.npmPackage} - local version: ${localVersion}`);
          console.log(`${this.npmPackage} - npm version: ${versionOnNpm3}`);

          if (versionOnNpm3 !== localVersion) {
            throw new Error('Error: npm package version mismatch!');
          }
        } else {
          console.log(`Warning: Workspace ${workspace} doesn\'t exist, so no npm update was performed!`);
        }
      });
      console.log(`npm publishing completed`);
    } else {
      console.log(`There are no outgoing commits for project: ${this.npmPackage} to the branch: ${this.branch}`);
    }
  }
}
