import fs from 'fs';
import ndPath from 'path';
import { some } from 'raku2-exists';
import { Transform } from 'stream';
import yazl from 'yazl';

import { Options, ProgressCallback, ProgressData } from '../index.d';

import { buildPathsInfoList } from './lib';

type Src = string | string[];

async function zip(
  src: Src,
  dest: string,
  options: Options,
  cb: ProgressCallback
): Promise<ProgressData>;

async function zip(
  src: Src,
  dest: string,
  options: Options
): Promise<ProgressData>;

async function zip(
  src: Src,
  dest: string,
  cb: ProgressCallback
): Promise<ProgressData>;

async function zip(src: Src, dest: string): Promise<ProgressData>;

async function zip(src: Src, dest: string, ...args: any[]) {
  let options: Options | undefined;
  let cb: ProgressCallback | undefined;

  if (args.length === 2) {
    options = args[0];
    cb = args[1];
  } else if (typeof args[0] === 'object') {
    options = args[0];
  } else if (typeof args[0] === 'function') {
    cb = args[0];
  }

  const { cwd, overwrite } = { cwd: '.', overwrite: true, ...options };

  const absDest = ndPath.resolve(cwd, dest);

  if (!overwrite && (await some(absDest))) {
    return null;
  }

  const pathsInfo = await buildPathsInfoList(src, cwd);

  const zip = new yazl.ZipFile();

  pathsInfo.forEach(({ dirname, paths, file }) => {
    if (paths.length === 0) {
      const to = ndPath.basename(dirname);
      zip.addEmptyDirectory(to);
      return;
    }

    paths.forEach(path => {
      const from = ndPath.join(dirname, path);
      const dir = file ? '' : ndPath.basename(dirname);
      const to = ndPath.join(dir, path);

      if (path.endsWith(ndPath.sep)) {
        zip.addEmptyDirectory(to);
        return;
      }

      zip.addFile(from, to);
    });
  });

  const data: ProgressData = {
    path: absDest,
    completedSize: 0,
    done: false
  };

  const filter = new Transform();
  const writeStream = fs.createWriteStream(absDest);

  filter._transform = (chunk, encoding, callback) => {
    data.completedSize += chunk.length;
    if (cb) {
      cb(data);
    }
    callback(null, chunk);
  };

  return await new Promise<ProgressData>(async resolve => {
    zip.outputStream
      .pipe(filter)
      .pipe(writeStream)
      .on('close', () => {
        data.done = true;
        if (cb) {
          cb(data);
        }
        resolve(data);
      });

    zip.end();
  });
}

module.exports = zip;
