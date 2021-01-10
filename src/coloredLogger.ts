import * as colors from 'colors';

export class ColoredLogger {
    printSuccess(message: string) {
        console.log(colors.green('SUCCESS: ' + message));
    }

    printWarning(message: string) {
        console.log(colors.yellow('WARNING: ' + message));
    }

    printInfo(message: string) {
        console.log(colors.cyan('INFO: ' + message));
    }

    printError(message: string) {
        console.log(colors.red('ERROR: ' + message));
    }

    showInfo(message: string) {
        console.log(colors.yellow(message));
    }
}
