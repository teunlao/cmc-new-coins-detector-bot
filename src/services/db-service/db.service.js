import fs from 'fs';

export default class DbService {
  constructor() {}

  getData(path) {
    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(path));
  }

  setData(path, data) {
    fs.writeFileSync(path, JSON.stringify(data));
  }
}
