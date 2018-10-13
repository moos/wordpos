

class BaseFile {

  /**
   * file contents
   * @type {Object}
   */
  file = {};

  constructor(type, dictPath, posName) {
    this.filePath = `${dictPath}/${type}.${posName}.js`;
    this.type = type;
  }

  load() {
    return import(this.filePath)
      .then(exports => this.file = exports.default)
      .catch(err => {
        console.error(`Error loading ${this.type} file for ${this.filePath}.`, err);
        throw err;
      });
  }

  ready(fn, args) {
    return this.load().then(() => fn.apply(this, args));
  }
}

export default BaseFile;
