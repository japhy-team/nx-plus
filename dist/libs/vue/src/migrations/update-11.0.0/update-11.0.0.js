"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const workspace_1 = require("@nrwl/workspace");
const path = require("path");
function deleteExtendInEslintConfig() {
    return (tree) => {
        var _a, _b;
        const { projects } = workspace_1.readWorkspace(tree);
        for (const key in projects) {
            const project = projects[key];
            if (((_a = project === null || project === void 0 ? void 0 : project.architect) === null || _a === void 0 ? void 0 : _a.lint) || ((_b = project === null || project === void 0 ? void 0 : project.targets) === null || _b === void 0 ? void 0 : _b.lint)) {
                const eslintConfig = '.eslintrc.js';
                if (!tree.exists(path.join(project.root, eslintConfig))) {
                    continue;
                }
                const content = tree
                    .read(path.join(project.root, eslintConfig))
                    .toString('utf-8');
                if (content.includes('plugin:vue')) {
                    tree.overwrite(path.join(project.root, eslintConfig), content.replace(/'prettier\/@typescript-eslint',?/g, ''));
                }
            }
        }
    };
}
function update() {
    return schematics_1.chain([
        workspace_1.updatePackagesInPackageJson(path.join(__dirname, '../../../', 'migrations.json'), '11.0.0'),
        workspace_1.addDepsToPackageJson({}, { 'eslint-config-prettier': '8.1.0' }),
        deleteExtendInEslintConfig(),
    ]);
}
exports.default = update;
//# sourceMappingURL=update-11.0.0.js.map