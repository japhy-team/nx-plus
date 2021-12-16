"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vuexGenerator = exports.vuexSchematic = void 0;
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const workspace_1 = require("@nrwl/workspace");
const ast_utils_1 = require("@nrwl/workspace/src/utils/ast-utils");
const ngcli_adapter_1 = require("@nrwl/devkit/ngcli-adapter");
const semver = require("semver");
const ts = require("typescript");
const app_root_1 = require("../../app-root");
const utils_1 = require("../../utils");
function addStoreConfig(options, isVue3) {
    return (tree) => {
        const { sourceRoot } = workspace_1.getProjectConfig(tree, options.project);
        const vue2Content = core_1.tags.stripIndent `
      import Vue from 'vue';
      import Vuex from 'vuex';

      Vue.use(Vuex);

      export default new Vuex.Store({
        state: {},
        mutations: {},
        actions: {},
        modules: {}
      });
    `;
        const vue3Content = core_1.tags.stripIndent `
      import { createStore } from 'vuex';

      export default createStore({
        state: {},
        mutations: {},
        actions: {},
        modules: {}
      });
    `;
        tree.create(core_1.join(core_1.normalize(sourceRoot), 'store/index.ts'), isVue3 ? vue3Content : vue2Content);
        return tree;
    };
}
function getNewVueExpression(sourceFile) {
    const callExpressions = workspace_1.findNodes(sourceFile, ts.SyntaxKind.CallExpression);
    for (const callExpr of callExpressions) {
        const { expression: innerExpr } = callExpr;
        if (ts.isPropertyAccessExpression(innerExpr) &&
            /new Vue/.test(innerExpr.expression.getText())) {
            return innerExpr.expression;
        }
    }
    return null;
}
function getCreateAppCallExpression(sourceFile) {
    const callExpressions = workspace_1.findNodes(sourceFile, ts.SyntaxKind.CallExpression);
    return callExpressions.find((callExpr) => callExpr.expression.getText() === 'createApp');
}
function addStoreToMain(options, isVue3) {
    return (tree) => {
        const { sourceRoot } = workspace_1.getProjectConfig(tree, options.project);
        const mainPath = core_1.join(core_1.normalize(sourceRoot), 'main.ts');
        if (!tree.exists(mainPath)) {
            throw new Error(`Could not find ${mainPath}.`);
        }
        const mainSourceFile = ts.createSourceFile(mainPath, tree.read(mainPath).toString('utf-8'), ts.ScriptTarget.Latest, true);
        let position;
        let content;
        if (isVue3) {
            const createAppCallExpression = getCreateAppCallExpression(mainSourceFile);
            if (!createAppCallExpression) {
                throw new Error(`Could not find 'createApp' call in ${mainPath}.`);
            }
            position = createAppCallExpression.end;
            content = '.use(store)';
        }
        else {
            const newVueExpression = getNewVueExpression(mainSourceFile);
            if (!newVueExpression) {
                throw new Error(`Could not find Vue instantiation in ${mainPath}.`);
            }
            position = newVueExpression.arguments[0].getStart() + 1;
            content = '\n  store,';
        }
        workspace_1.insert(tree, mainPath, [
            ast_utils_1.insertImport(mainSourceFile, mainPath, 'store', './store', true),
            new ast_utils_1.InsertChange(mainPath, position, content),
        ]);
        return tree;
    };
}
function vuexSchematic(options) {
    const vue = utils_1.loadModule('vue', app_root_1.appRootPath);
    const isVue3 = semver.major(vue.version) === 3;
    return schematics_1.chain([
        addStoreConfig(options, isVue3),
        addStoreToMain(options, isVue3),
        workspace_1.addDepsToPackageJson({ vuex: isVue3 ? '^4.0.0-0' : '^3.4.0' }, {}, true),
        workspace_1.formatFiles(options),
    ]);
}
exports.vuexSchematic = vuexSchematic;
exports.default = vuexSchematic;
exports.vuexGenerator = ngcli_adapter_1.wrapAngularDevkitSchematic('@nx-plus/vue', 'vuex');
//# sourceMappingURL=schematic.js.map