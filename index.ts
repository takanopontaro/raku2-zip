import fs from 'fs';
import globby from 'globby';
import ndPath from 'path';
import { Transform } from 'stream';
import yazl from 'yazl';

export type ProgressData = {
  path: string;
  completedSize: number;
  done: boolean;
};

export type ProgressCallback = (data: ProgressData) => void;

module.exports = (
  cwd: string,
  src: string | string[],
  dest: string,
  cb?: ProgressCallback
) => {
  return new Promise<ProgressData>(async resolve => {
    let list = await globby(src, {
      markDirectories: true,
      onlyFiles: false
    });

    list = list.sort().filter((path, i) => {
      if (!path.endsWith(ndPath.sep)) return true;
      const next = list[i + 1];
      return next && next.indexOf(path) === 0 ? false : true;
    });

    const zip = new yazl.ZipFile();

    list.forEach(path => {
      const relPath = ndPath.relative(cwd, path);
      if (!path.endsWith(ndPath.sep)) zip.addFile(path, relPath);
      else zip.addEmptyDirectory(relPath);
    });

    const data: ProgressData = {
      path: dest,
      completedSize: 0,
      done: false
    };

    const filter = new Transform();
    const writeStream = fs.createWriteStream(dest);

    filter._transform = (chunk, encoding, callback) => {
      data.completedSize += chunk.length;
      if (cb) cb(data);
      callback(null, chunk);
    };

    zip.outputStream
      .pipe(filter)
      .pipe(writeStream)
      .on('close', () => {
        data.done = true;
        if (cb) cb(data);
        resolve(data);
      });

    zip.end();
  });
};
