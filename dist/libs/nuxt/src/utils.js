"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadModule = exports.getProjectRoot = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@angular-devkit/core");
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module');
function getProjectRoot(context) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const projectMetadata = yield context.getProjectMetadata(context.target.project);
        return core_1.resolve(core_1.normalize(context.workspaceRoot), core_1.normalize(projectMetadata.root || ''));
    });
}
exports.getProjectRoot = getProjectRoot;
function loadModule(request, context, force = false) {
    try {
        return createRequire(path.resolve(context, 'package.json'))(request);
    }
    catch (e) {
        const resolvedPath = require.resolve(request, { paths: [context] });
        if (resolvedPath) {
            if (force) {
                clearRequireCache(resolvedPath);
            }
            return require(resolvedPath);
        }
    }
}
exports.loadModule = loadModule;
// https://github.com/benmosher/eslint-plugin-import/pull/1591
// https://github.com/benmosher/eslint-plugin-import/pull/1602
// Polyfill Node's `Module.createRequireFromPath` if not present (added in Node v10.12.0)
// Use `Module.createRequire` if available (added in Node v12.2.0)
const createRequire = Module.createRequire ||
    Module.createRequireFromPath ||
    function (filename) {
        const mod = new Module(filename, null);
        mod.filename = filename;
        mod.paths = Module._nodeModulePaths(path.dirname(filename));
        mod._compile(`module.exports = require;`, filename);
        return mod.exports;
    };
function clearRequireCache(id, map = new Map()) {
    const module = require.cache[id];
    if (module) {
        map.set(id, true);
        // Clear children modules
        module.children.forEach((child) => {
            if (!map.get(child.id))
                clearRequireCache(child.id, map);
        });
        delete require.cache[id];
    }
}
//# sourceMappingURL=utils.js.map