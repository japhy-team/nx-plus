"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const workspace_1 = require("@nrwl/workspace");
const devkit_1 = require("@nrwl/devkit");
const semver = require("semver");
const ts = require("typescript");
function updateJestPropertyAssignment(tree, fileName, node, value) {
    const newContent = devkit_1.applyChangesToString(tree.read(fileName, 'utf-8'), [
        {
            type: devkit_1.ChangeType.Delete,
            start: node.initializer.pos,
            length: node.initializer.getFullText().length,
        },
        {
            type: devkit_1.ChangeType.Insert,
            index: node.initializer.pos,
            text: value,
        },
    ]);
    tree.write(fileName, newContent);
}
function updateJestConfig(tree, projectRoot, isVue3) {
    const jestConfig = `${projectRoot}/jest.config.js`;
    const getJestConfigSourceFile = () => ts.createSourceFile('jest.config.js', tree.read(jestConfig, 'utf-8'), ts.ScriptTarget.Latest, true);
    const [vueTransform] = workspace_1.findNodes(getJestConfigSourceFile(), ts.SyntaxKind.PropertyAssignment).filter((node) => ts.isStringLiteral(node.name) &&
        (node.name.text === '.*\\.(vue)$' || node.name.text === '^.+\\.vue$'));
    if (!vueTransform) {
        console.log(`Could not find 'vue-jest' transform in ${jestConfig}. No changes will be made.`);
        return;
    }
    updateJestPropertyAssignment(tree, jestConfig, vueTransform, `'${isVue3 ? 'vue3-jest' : '@vue/vue2-jest'}'`);
    const [vueJest] = workspace_1.findNodes(getJestConfigSourceFile(), ts.SyntaxKind.PropertyAssignment).filter((node) => ts.isStringLiteral(node.name) && node.name.text === 'vue-jest');
    if (!vueJest) {
        console.log(`Could not find 'vue-jest' global in ${jestConfig}. No changes will be made.`);
        return;
    }
    const hasBabel = tree.exists(`${projectRoot}/babel.config.js`);
    updateJestPropertyAssignment(tree, jestConfig, vueJest, JSON.stringify(Object.assign({ tsConfig: `${projectRoot}/tsconfig.spec.json` }, (hasBabel ? { babelConfig: `${projectRoot}/babel.config.js` } : {}))));
}
function update(tree) {
    var _a, _b, _c;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const packageJson = devkit_1.readJson(tree, 'package.json');
        const vueVersion = (_a = packageJson === null || packageJson === void 0 ? void 0 : packageJson.dependencies) === null || _a === void 0 ? void 0 : _a.vue;
        if (!vueVersion) {
            console.warn('Vue install not found. No changes will be made.');
            return;
        }
        const isVue3 = semver.satisfies(semver.coerce(vueVersion).version, '^3.0.0');
        devkit_1.addDependenciesToPackageJson(tree, {}, isVue3
            ? { 'vue3-jest': '^27.0.0-alpha.1' }
            : { '@vue/vue2-jest': '^27.0.0-alpha.1' });
        const projects = devkit_1.getProjects(tree);
        for (const project of projects.values()) {
            if (((_c = (_b = project === null || project === void 0 ? void 0 : project.targets) === null || _b === void 0 ? void 0 : _b.test) === null || _c === void 0 ? void 0 : _c.executor) === '@nrwl/jest:jest' &&
                tree
                    .read(project.targets.test.options.jestConfig, 'utf-8')
                    .includes('vue-jest')) {
                updateJestConfig(tree, project.root, isVue3);
            }
        }
        yield workspace_1.formatFiles();
        console.log(`The package "vue-jest" is not compatible with Jest v27 and has been replaced with "${isVue3 ? 'vue3-jest' : '@vue/vue2-jest'}".
You can safely remove "vue-jest" from your "package.json".
Make sure to run "${devkit_1.getPackageManagerCommand().install}" to install the newly added dependencies.`);
    });
}
exports.default = update;
//# sourceMappingURL=update-12.2.0.js.map