import * as fs from 'fs-extra';

export class ObjectStorage {
  readonly ext = '.json';
  readonly storageLocation = 'objectStorage';
  private path = './' + this.storageLocation;

  setPath(path: string) {
    this.path = path;
  }

  managePath(path: string) {
    this.path = path + '/' + this.storageLocation;
  }

  setObject(name: string, obj: object) {
    if (obj instanceof Array) {
      obj = { array: obj };
    }

    if (typeof (obj) !== 'object') {
      throw new Error('Bad object! Try passing in a real object next time:)');
    }

    const stringVal = JSON.stringify(obj);
    if (!stringVal) {
      throw new Error('Bad stringify! Try passing in a real object next time:)');
    }

    if (!fs.existsSync(this.path)) {
      try {
        fs.mkdirSync(this.path);
      } catch (error) {
        throw new Error(`Bad path! Baseline path does not exist:)`);
      }
    }
    fs.writeFileSync(`${this.path}/${name}${this.ext}`, stringVal);
  }

  getObject(name: string) {
    const fullPath = `${this.path}/${name}${this.ext}`;
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Bad object name! Object Storage does not exist:)`);
    }

    let value = fs.readFileSync(fullPath).toString();
    if (value.charCodeAt(0) === 0xFEFF) {
      value = value.substring(1, value.length);
    }

    if (!value) {
      throw new Error(`Bad object name! Try passing in a 'real object name' next time:)`);
    }
    if (value.substring(0, 1) === '{') {
      const obj: any = JSON.parse(value);
      if ('array' in obj) {
        return obj.array;
      }
      return obj;
    }
    return null;
  }
}