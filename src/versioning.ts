import { CommonTasks } from './commonTasks';
import { ColoredLogger } from './coloredLogger';
import { AppSettings, ApiVersions } from '../../ngx-modelling';

export class Versioning {
    readonly ct = new CommonTasks();
    private readonly cl = new ColoredLogger();

    constructor() {
        try {
            new CommonTasks();
        } catch (e) {
            console.log(e);
            while (true) { };
        }
    }

    updatePackageVersion(): string {
        const packageJson = this.ct.getPackageJson();
        const versionParts = packageJson.version.split('.');
        let versionPatch = parseInt(versionParts[2], 10);
        versionPatch++;
        versionParts[2] = versionPatch.toString();
        packageJson.version = versionParts.join('.');
        this.ct.setPackageJson(packageJson);
        return packageJson.version;
    }

    updateVersions(): string {
        const buildVersion = this.updatePackageVersion();
        const apiVersions: ApiVersions = this.ct.getApiVersions();
        apiVersions.nodeJs = process.versions.node;
        apiVersions.v8Engine = process.versions.v8;
        apiVersions.buildVersion = buildVersion;
        this.ct.setApiVersions(apiVersions);
        return buildVersion;
    }
}
