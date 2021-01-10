import { CommonTasks } from './commonTasks';
import { ColoredLogger } from './coloredLogger';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as base64Img from 'base64-img';

export class ProductionReady {
  private readonly cl = new ColoredLogger();
  private readonly ct = new CommonTasks();
  private readonly imageTagBeg = '<img';
  private readonly imageTagEnd = '/>';
  private readonly srcBeg = 'src=';
  private readonly srcEnd = '.png\'';
  private readonly crlf = '\r\n';
  private readonly appServiceWorkerTemplate = 'wwwroot/serviceWorker-template.js';
  private readonly squashedSignal = '/* this was squashed */';

  addProdMode(inputFile: string, outputFile: string, middleString: string, identifier: string) {
    const data = fs.readFileSync(inputFile, 'utf-8');
    const s = data.toString();
    const insertIndex = s.lastIndexOf(identifier);
    const beginning = s.substring(0, insertIndex);
    const middle = middleString;
    const ending = s.substring(insertIndex);
    const imageTagBeg = '<img';
    const imageTagEnd = '/>';
    const srcBeg = 'src=';
    const srcEnd = '.png\'';

    fs.writeFileSync(outputFile, beginning + middle + '\n' + ending);
  }

  removeProdMode(inputFile: string, outputFile: string, identifier: string) {
    const data = fs.readFileSync(inputFile, 'utf-8');
    let s = data.toString();
    let insertIndex = 0;
    let beginning = '';
    let ending = '';
    do {
      insertIndex = s.lastIndexOf(identifier);
      if (insertIndex !== -1) {
        beginning = s.substring(0, insertIndex);
        ending = s.substring(insertIndex + identifier.length + 1);
        s = beginning + ending;
      }

    } while (insertIndex !== -1);
    if (beginning.length > 0) {
      fs.writeFileSync(outputFile, beginning + ending);
    }
  }

  embed_image(path: string) {
    // please note that this only works for static files in the application
    // for dynamic files or file in another domain, use the Angular [src]=''
    glob.sync(path + '/**/*.html').forEach((file: string) => {
      let dataResource = fs.readFileSync(file).toString();
      if (dataResource.charCodeAt(0) === 0xFEFF) {
        dataResource = dataResource.substr(1, dataResource.length);
      }
      let beforeImageString = '';
      let imageTagString = '';
      let afterImageString = '';
      let newHtmlFile = '';
      let index = 0;
      let embededResource = false;
      let imageTagBegIndex: number;
      // begnning of file while
      do {
        dataResource = dataResource.substr(index);
        // some variables are used for development
        imageTagBegIndex = dataResource.indexOf(this.imageTagBeg);
        if (imageTagBegIndex !== -1) {
          beforeImageString = dataResource.substr(0, imageTagBegIndex);
          imageTagString = dataResource.substr(imageTagBegIndex);

          const imageTagEndIndex = imageTagString.indexOf(this.imageTagEnd);
          afterImageString = imageTagString.substr(imageTagEndIndex + this.imageTagEnd.length);
          imageTagString = imageTagString.substr(0, imageTagEndIndex + this.imageTagEnd.length);
          index = imageTagBegIndex + imageTagString.length;

          if (imageTagString.indexOf('data:image') === -1) {

            if (imageTagString.indexOf('[src') !== -1) {
              newHtmlFile += beforeImageString + imageTagString;
              continue;
            }
            const srcIndex = imageTagString.indexOf(' src');
            if (srcIndex !== -1) {
              const beforeSrcString = imageTagString.substr(0, imageTagString.indexOf(this.srcBeg));
              const srcDelimiter = imageTagString.substr(imageTagString.indexOf(this.srcBeg) + this.srcBeg.length, 1);
              let imageUrl = imageTagString.substr(imageTagString.indexOf(this.srcBeg) + this.srcBeg.length + 1);

              imageUrl = imageUrl.replace(/\.\.\//g, '');
              const afterSrcString = imageUrl.substr(imageUrl.indexOf(srcDelimiter) + 1);
              imageUrl = 'wwwroot/' + imageUrl.substr(0, imageUrl.indexOf(srcDelimiter));
              // skip any image in the assets folder
              if (imageUrl.indexOf('assets') === -1) {
                embededResource = true;
                let imageData: string;
                try {
                  imageData = base64Img.base64Sync(imageUrl);
                } catch (e) {
                  imageData = 'CANNOT FIND IMAGE:)';
                }
                newHtmlFile += beforeImageString + beforeSrcString + 'src=' + srcDelimiter +
                  imageData + srcDelimiter + afterSrcString;
              }
            }
          }
        } else {
          newHtmlFile += dataResource;
        }
      } while (imageTagBegIndex !== -1);

      if (newHtmlFile.length > 0 && embededResource) {
        const filex = file.replace('html', 'base64.html');
        fs.writeFileSync(filex, newHtmlFile);
        this.cl.printInfo('\nbase64.html: ' + filex + '\n');
      }
    });
  }

  createServiceWorker(distFolder: string, version: string) {
    let ngswPath = require.resolve("./productionReady");
    ngswPath = ngswPath.substr(0, ngswPath.lastIndexOf('\\'));
    ngswPath += '\\ngsw.js';

    if (fs.existsSync(ngswPath)) {
      let filesString = '';

      const crlf = '\r\n';
      glob.sync(distFolder + '/**/*.*').forEach((file) => {
        file = file.substr(file.indexOf('dist'));
        filesString += `    '/${file}',${crlf}`;
      });
      let sw = fs.readFileSync(ngswPath).toString();
      sw = sw.replace(/replacement_script_goes_here/g, filesString);
      sw = sw.replace(/serviceWorker.js/g, 'ngsw.js');
      sw = sw.replace(/swVersion/g, version);
      fs.writeFileSync(distFolder + '/ngsw.js', sw);
    } else {
      this.cl.printError('ngsw.js doesn\'t exist! Can\'t create Service Worker!');
      while (true) { const noop = true; }
    }
  }

  copyProjectFiles(distFolder: string) {
    const manifest = fs.readFileSync('manifest.json').toString();
    fs.writeFileSync(distFolder + '/manifest.json', manifest);
    const favicon = fs.readFileSync('favicon.ico');
    fs.writeFileSync(distFolder + '/favicon.ico', favicon);
  }

  enableServiceWorker(distFolder: string) {
    const pathToIndex = distFolder + '/index.html';
    let indexHtml = fs.readFileSync(pathToIndex).toString();
    const beg = '<!--begin serviceWorker script';
    const end = 'end serviceWorker script-->';
    indexHtml = indexHtml.replace(beg, '');
    indexHtml = indexHtml.replace(end, '');
    fs.writeFileSync(pathToIndex, indexHtml);
  }

  removeServiceWorker(distFolder: string) {
    const pathToIndex = distFolder + '/index.html';
    const indexHtml = fs.readFileSync(pathToIndex).toString();
    const beg = '<!--begin serviceWorker script';
    const end = 'end serviceWorker script-->';
    let newHtml = indexHtml.substr(0, indexHtml.indexOf(beg));
    newHtml += indexHtml.substr(indexHtml.indexOf(end) + end.length);
    fs.writeFileSync(pathToIndex, newHtml);
  }

  manageManifestPath(distFolder: string) {
    const pathToIndex = distFolder + '/index.html';
    let indexHtml = fs.readFileSync(pathToIndex).toString();
    indexHtml = indexHtml.replace('../manifest.json', '/' + distFolder + '/manifest.json');
    indexHtml = indexHtml.replace('-debug build)', '-release build)');
    fs.writeFileSync(pathToIndex, indexHtml);
  }

  manifestForPopup(distFolder: string) {
    const extension = distFolder.substr(distFolder.lastIndexOf('/') + 1);
    const pathToManifest = process.cwd() + '/projects/extensions/popup.json';
    const pathToExtensions = process.cwd() + '/projects/extensions';
    if (fs.existsSync(pathToManifest)) {
      fs.copyFileSync(pathToManifest, distFolder + '/manifest.json');
      fs.copyFileSync(pathToExtensions + '/icon16.png', distFolder + '/icon16.png');
      fs.copyFileSync(pathToExtensions + '/icon48.png', distFolder + '/icon48.png');
      fs.copyFileSync(pathToExtensions + '/icon128.png', distFolder + '/icon128.png');
      let manifest = fs.readFileSync(distFolder + '/manifest.json').toString();
      manifest = manifest.replace(/template/g, extension);
      fs.writeFileSync(distFolder + '/manifest.json', manifest);
    } else {
      throw new Error(pathToManifest + " does not exist!");
    }
  }

  manifestForTab(distFolder: string) {
    const extension = distFolder.substr(distFolder.lastIndexOf('/') + 1);
    const pathToManifest = process.cwd() + '/projects/extensions/tab.json';
    const pathToExtensions = process.cwd() + '/projects/extensions';
    const pathToBackground = process.cwd() + '/projects/extensions/background.js';
    if (fs.existsSync(pathToManifest)) {
      fs.copyFileSync(pathToManifest, distFolder + '/manifest.json');
      fs.copyFileSync(pathToExtensions + '/icon16.png', distFolder + '/icon16.png');
      fs.copyFileSync(pathToExtensions + '/icon48.png', distFolder + '/icon48.png');
      fs.copyFileSync(pathToExtensions + '/icon128.png', distFolder + '/icon128.png');
      let manifest = fs.readFileSync(distFolder + '/manifest.json').toString();
      manifest = manifest.replace(/template/g, extension);
      fs.writeFileSync(distFolder + '/manifest.json', manifest);
      if (fs.existsSync(pathToBackground)) {
        fs.copyFileSync(pathToBackground, distFolder + '/background.js');
      } else {
        throw new Error(pathToBackground + " does not exist!");
      }
    } else {
      throw new Error(pathToManifest + " does not exist!");
    }
  }

}
