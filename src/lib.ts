import fs from 'fs';
import globby from 'globby';
import ndPath from 'path';
import { promisify } from 'util';

const stat = promisify(fs.stat);

const SEP = ndPath.sep;

export interface PathsInfo {
  dirname: string;
  paths: string[];
  file: boolean;
}

export function normalizeDirs(paths: string[]) {
  return paths.sort().filter((path, i) => {
    if (!path.endsWith(SEP)) {
      return true;
    }

    const next = paths[i + 1];
    if (!next || next.indexOf(path) !== 0) {
      return true;
    }

    return false;
  });
}

export function relative(from: string, to: string) {
  const path = ndPath.relative(from, to);
  return to.endsWith(SEP) ? ndPath.join(path, SEP) : path;
}

export function buildPathsInfoList(src: string | string[], cwd: string) {
  const sources = src instanceof Array ? src : [src];

  const iterable = sources.map(async source => {
    const abs = ndPath.resolve(cwd, source);
    const base = ndPath.basename(abs);

    try {
      const stats = await stat(abs);

      if (stats.isFile()) {
        return {
          dirname: ndPath.dirname(abs),
          paths: [base],
          file: true
        };
      }

      const paths = await globby(abs, {
        onlyFiles: false,
        markDirectories: true,
        absolute: true
      });

      if (paths.length === 0) {
        return {
          dirname: abs,
          paths: [],
          file: false
        };
      }

      return {
        dirname: abs,
        paths: normalizeDirs(paths).map(path => relative(abs, path)),
        file: false
      };
    } catch (e) {
      throw e;
    }
  });

  return Promise.all<PathsInfo>(iterable);
}
