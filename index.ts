import fs from 'fs';
import globby from 'globby';
import ndPath from 'path';
import { Transform } from 'stream';
import yazl from 'yazl';

export type TInfo = {
  path: string;
  byte: number;
  done: boolean;
};

export type TCallback = (info: TInfo) => void;

export default (cwd: string, paths: string[], dest: string, cb?: TCallback) => {
  return new Promise<TInfo>(async resolve => {
    let list = await globby(paths, {
      markDirectories: true,
      onlyFiles: false
    });

    list = list.sort().filter((path, i) => {
      if (!path.endsWith('/')) return true;
      const next = paths[i + 1];
      return next && next.indexOf(path) === 0 ? false : true;
    });

    const zip = new yazl.ZipFile();

    list.forEach(path => {
      const relPath = ndPath.relative(cwd, path);
      if (!path.endsWith('/')) zip.addFile(path, relPath);
      else zip.addEmptyDirectory(relPath);
    });

    const info: TInfo = {
      path: dest,
      byte: 0,
      done: false
    };

    const filter = new Transform();
    const writeStream = fs.createWriteStream(dest);

    filter._transform = (chunk, encoding, callback) => {
      info.byte += chunk.length;
      cb && cb(info);
      callback(null, chunk);
    };

    zip.outputStream
      .pipe(filter)
      .pipe(writeStream)
      .on('close', () => {
        info.done = true;
        cb && cb(info);
        resolve(info);
      });

    zip.end();
  });
};
