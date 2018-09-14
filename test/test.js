const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const del = require('del');
const fs = require('fs');
const mkdir = require('make-dir');
const path = require('path');
const unzip = require('raku2-unzip');
const { promisify } = require('util');

const zip = require('..');
const { normalizeDirs, relative, buildPathsInfoList } = require('../dist/lib');

const writeFile = promisify(fs.writeFile);

chai.use(chaiAsPromised);

const assert = chai.assert;

async function touch(p) {
  await mkdir(path.dirname(p));
  await writeFile(p, '');
}

process.chdir(__dirname);

before(async () => {
  await touch('src/1.txt');
  await touch('src/a/2.txt');
  await mkdir('src/a/empty-dir');
  await touch('src/a/ディレクトリ/ファイル.txt');
});

after(async () => {
  await del(['src']);
});

afterEach(async () => {
  await del(['dest.zip', 'dest']);
});

describe('lib', () => {
  it('normalizeDirs', () => {
    // prettier-ignore
    const paths = [
      '/a/b/c/',
      '/a/b/',
      '/a/b/d/',
      '/a/b/c/1.txt',
      '/a/b/d.txt'
    ];
    // prettier-ignore
    const expects = [
      '/a/b/c/1.txt',
      '/a/b/d.txt',
      '/a/b/d/'
    ];
    assert.deepEqual(normalizeDirs(paths), expects);
  });

  it('relative', () => {
    const res1 = relative('/a/b', '/a/b/c/d.txt');
    const res2 = relative('/a/b', '/a/b/c/d/');
    assert.equal(res1, 'c/d.txt');
    assert.equal(res2, 'c/d/');
  });

  it('buildPathsInfo', async () => {
    const dirname = path.resolve('src');
    // prettier-ignore
    const paths = [
      '1.txt',
      'a/2.txt',
      'a/empty-dir/',
      'a/ディレクトリ/ファイル.txt',
    ];
    const expects = { dirname, paths, file: false };
    const res = await buildPathsInfoList('src', '.');
    assert.deepEqual(res[0], expects);
  });
});

describe('main', () => {
  it('zip', async () => {
    await zip('src', 'dest.zip');
    await unzip('dest.zip', 'dest');
    assert.equal(true, fs.existsSync('dest/dest/src/1.txt'));
    assert.equal(true, fs.existsSync('dest/dest/src/a/2.txt'));
    assert.equal(true, fs.existsSync('dest/dest/src/a/empty-dir'));
    assert.equal(
      true,
      fs.existsSync('dest/dest/src/a/ディレクトリ/ファイル.txt')
    );
  });

  it('zip (2)', async () => {
    await zip(
      ['src/a/ディレクトリ', 'src/a/empty-dir', 'src/a/2.txt'],
      'dest.zip'
    );
    await unzip('dest.zip', 'dest');
    assert.equal(true, fs.existsSync('dest/dest/ディレクトリ/ファイル.txt'));
    assert.equal(true, fs.existsSync('dest/dest/empty-dir'));
    assert.equal(true, fs.existsSync('dest/dest/2.txt'));
  });
});
