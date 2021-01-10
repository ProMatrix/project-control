import * as ncli from 'node-command-line';
import * as promise from 'bluebird';
import * as cP from 'child_process';

export class CommandLine {

  // executeLaunch(input, callback: () => void, synchronous: boolean) { // eslint-disable-line no-use-before-define
  //   try {
  //     let command = 'dotnet run -p ' + input + '.csproj';
  //     command += ' -c release --no-build';
  //     console.log(process.cwd() + '> ' + command);
  //     if (synchronous) {
  //       this.executeSync(command);
  //       callback();
  //     } else {
  //       this.execute(command, callback);
  //     }
  //   } catch (e) {
  //     throw new Error(e);
  //   }
  // }

  // executeAdd(input: string, synchronous: boolean, callback: () => void) {
  //   try {
  //     const addString = 'ng generate @schematics/angular:application ' + input + ' --minimal';
  //     console.log(addString);
  //     if (synchronous) {
  //       this.executeSync(addString);
  //       callback();
  //     } else {
  //       promise.coroutine(function* () {
  //         const response = yield ncli.run(addString);
  //         if (response.success) {
  //           callback();
  //         } else {
  //           throw new Error('Error executing Add command!');
  //         }
  //       })();
  //     }
  //   } catch (e) {
  //     throw new Error(e);
  //   }
  // }

  // executeLint(input: string, synchronous: boolean, success: (x: string) => void, error: (x: string) => void) {
  //   try {
  //     const lintString = 'ng lint ' + input;
  //     console.log(lintString);
  //     if (synchronous) {
  //       success(this.executeSync(lintString));
  //     } else {
  //       this.executeCP(lintString, (s)=>{
  //         success(s);
  //       }, (e)=>{
  //         error(e);
  //       });
  //     }
  //   } catch (e) {
  //     error(e);
  //   }
  // }

  // executeBuild(input: string, output: string, production: boolean, synchronous: boolean, success: (x: string) => void, error: (x: string) => void) {
  //   try {
  //     let addProduction = '';
  //     if (production) {
  //       addProduction = ' --configuration=production  --aot=false --build-optimizer=false  --source-map=false';
  //     }
  //     const progress = ' --progress=false';
  //     const buildString = 'ng build ' + input + ' --outputPath=./' + output + ' --baseHref=/' + output +
  //       '/ --no-deleteOutputPath' + addProduction + progress;
  //     console.log(buildString);
  //     if (synchronous) {
  //       success(this.executeSync(buildString));
  //     } else {
  //       this.executeCP(buildString, (s)=>{
  //         success(s);
  //       }, (e)=>{
  //         error(e);
  //       });
  //     }
  //   } catch (e) {
  //     error(e);
  //   }
  // }

  // executeUtest(input: string, synchronous: boolean, success: (x: string) => void, error: (x: string) => void) {
  //   try {
  //     const processString = `ng test ${input} --watch=false`;
  //     console.log(processString);
  //     if (synchronous) {
  //       success(this.executeSync(processString));
  //     } else {
  //       this.executeCP(processString, (s)=>{
  //         success(s);
  //       }, (e)=>{
  //         error(e);
  //       });
  //     }
  //   } catch (e) {
  //     error(e);
  //   }
  // }

  // executeE2eTesting(processString: string, synchronous: boolean, success: (x: string) => void, error: (x: string) => void) {
  //   try {
  //     console.log(processString);
  //     if (synchronous) {
  //       success(this.executeSync(processString));
  //     } else {
  //       this.executeCP(processString, (s)=>{
  //         success(s);
  //       }, (e)=>{
  //         error(e);
  //       });
  //     }
  //   } catch (e) {
  //     error(e);
  //   }
  // }

  executeCP(command: string, success: (x: string) => void, error: (x: string) => void) {
    try {
      const cp = cP.exec(command, (err, s, e) =>{
        if(err){
          error(err.message);
        }else{
          success(s);
        }
      });
    } catch (e) {
      error(e);
    }
  }

  execute(command: string, callback: () => void) {
    try {
      ncli.run(command);
      callback();
    } catch (e) {
      throw new Error(e);
    }
  }

  delay(msDelay: number) {
    this.executeSync(`"${process.argv[0]}" -e setTimeout(function(){},${msDelay})`);
  }

  executeSync(command: string): string {
    try {
      const stdout = cP.execSync(command);
      return stdout.toString();
    } catch (e) {
      throw new Error(e.message);
    }
  }
}
