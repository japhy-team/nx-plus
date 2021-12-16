"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const jest_1 = require("@nrwl/jest");
const workspace_1 = require("@nrwl/workspace");
const ts = require("typescript");
function updateJestConfig(projectRoot) {
    return (tree) => {
        const jestConfig = 'jest.config.js';
        const content = tree.read(`${projectRoot}/${jestConfig}`).toString();
        const sourceFile = ts.createSourceFile(jestConfig, content, ts.ScriptTarget.Latest, true);
        const hasGlobals = workspace_1.findNodes(sourceFile, ts.SyntaxKind.PropertyAssignment).some((node) => ts.isIdentifier(node.name) && node.name.text === 'globals');
        const vueJestConfig = { tsConfig: `${projectRoot}/tsconfig.spec.json` };
        if (!hasGlobals) {
            return jest_1.addPropertyToJestConfig(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tree, `${projectRoot}/${jestConfig}`, 'globals', { 'vue-jest': vueJestConfig });
        }
        else {
            return jest_1.addPropertyToJestConfig(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tree, `${projectRoot}/${jestConfig}`, 'globals.vue-jest', vueJestConfig);
        }
    };
}
function updateTestConfigs(projectRoot) {
    return schematics_1.chain([
        workspace_1.updateJsonInTree(projectRoot + '/tsconfig.spec.json', (json) => {
            json.compilerOptions = Object.assign(Object.assign({}, json.compilerOptions), { jsx: 'preserve', esModuleInterop: true, allowSyntheticDefaultImports: true });
            return json;
        }),
        updateJestConfig(projectRoot),
    ]);
}
function update() {
    return schematics_1.chain([
        (tree) => {
            const workspace = workspace_1.readWorkspace(tree);
            return schematics_1.chain(Object.keys(workspace.projects).map((key) => {
                const project = workspace.projects[key];
                if (project.architect &&
                    project.architect.test &&
                    project.architect.test.builder === '@nrwl/jest:jest' &&
                    tree
                        .read(project.architect.test.options.jestConfig)
                        .toString('utf-8')
                        .includes('vue-jest')) {
                    return updateTestConfigs(project.root);
                }
                return schematics_1.noop();
            }));
        },
    ]);
}
exports.default = update;
//# sourceMappingURL=update-10.0.0.js.map