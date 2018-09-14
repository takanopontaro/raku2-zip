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
const globby_1 = __importDefault(require("globby"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const stat = util_1.promisify(fs_1.default.stat);
const SEP = path_1.default.sep;
function normalizeDirs(paths) {
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
exports.normalizeDirs = normalizeDirs;
function relative(from, to) {
    const path = path_1.default.relative(from, to);
    return to.endsWith(SEP) ? path_1.default.join(path, SEP) : path;
}
exports.relative = relative;
function buildPathsInfoList(src, cwd) {
    const sources = src instanceof Array ? src : [src];
    const iterable = sources.map((source) => __awaiter(this, void 0, void 0, function* () {
        const abs = path_1.default.resolve(cwd, source);
        const base = path_1.default.basename(abs);
        try {
            const stats = yield stat(abs);
            if (stats.isFile()) {
                return {
                    dirname: path_1.default.dirname(abs),
                    paths: [base],
                    file: true
                };
            }
            const paths = yield globby_1.default(abs, {
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
        }
        catch (e) {
            throw e;
        }
    }));
    return Promise.all(iterable);
}
exports.buildPathsInfoList = buildPathsInfoList;
