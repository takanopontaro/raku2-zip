"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const raku2_exists_1 = require("raku2-exists");
const stream_1 = require("stream");
const yazl_1 = __importDefault(require("yazl"));
const lib_1 = require("./lib");
function zip(src, dest, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        let options;
        let cb;
        if (args.length === 2) {
            options = args[0];
            cb = args[1];
        }
        else if (typeof args[0] === 'object') {
            options = args[0];
        }
        else if (typeof args[0] === 'function') {
            cb = args[0];
        }
        const { cwd, overwrite } = Object.assign({ cwd: '.', overwrite: true }, options);
        const absDest = path_1.default.resolve(cwd, dest);
        if (!overwrite && (yield raku2_exists_1.some(absDest))) {
            return null;
        }
        const pathsInfo = yield lib_1.buildPathsInfoList(src, cwd);
        const zip = new yazl_1.default.ZipFile();
        pathsInfo.forEach(({ dirname, paths, file }) => {
            if (paths.length === 0) {
                const to = path_1.default.basename(dirname);
                zip.addEmptyDirectory(to);
                return;
            }
            paths.forEach(path => {
                const from = path_1.default.join(dirname, path);
                const dir = file ? '' : path_1.default.basename(dirname);
                const to = path_1.default.join(dir, path);
                if (path.endsWith(path_1.default.sep)) {
                    zip.addEmptyDirectory(to);
                    return;
                }
                zip.addFile(from, to);
            });
        });
        const data = {
            path: absDest,
            completedSize: 0,
            done: false
        };
        const filter = new stream_1.Transform();
        const writeStream = fs_1.default.createWriteStream(absDest);
        filter._transform = (chunk, encoding, callback) => {
            data.completedSize += chunk.length;
            if (cb) {
                cb(data);
            }
            callback(null, chunk);
        };
        return yield new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
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
        }));
    });
}
module.exports = zip;
