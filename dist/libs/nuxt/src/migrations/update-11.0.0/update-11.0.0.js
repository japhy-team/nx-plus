"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const workspace_1 = require("@nrwl/workspace");
const path = require("path");
function deleteExtendInEslintConfig() {
    return (tree) => {
        var _a, _b, _c, _d, _e, _f;
        const { projects } = workspace_1.readWorkspace(tree);
        for (const key in projects) {
            const project = projects[key];
            if ((((_b = (_a = project === null || project === void 0 ? void 0 : project.architect) === null || _a === void 0 ? void 0 : _a.build) === null || _b === void 0 ? void 0 : _b.builder) === '@nx-plus/nuxt:browser' ||
                ((_d = (_c = project === null || project === void 0 ? void 0 : project.targets) === null || _c === void 0 ? void 0 : _c.build) === null || _d === void 0 ? void 0 : _d.executor) === '@nx-plus/nuxt:browser') &&
                (((_e = project === null || project === void 0 ? void 0 : project.architect) === null || _e === void 0 ? void 0 : _e.lint) || ((_f = project === null || project === void 0 ? void 0 : project.targets) === null || _f === void 0 ? void 0 : _f.lint))) {
                const eslintConfig = '.eslintrc.js';
                const content = tree
                    .read(path.join(project.root, eslintConfig))
                    .toString('utf-8')
                    .replace(/'prettier\/@typescript-eslint',?/g, '');
                tree.overwrite(path.join(project.root, eslintConfig), content);
            }
        }
    };
}
function update() {
    return schematics_1.chain([
        workspace_1.updatePackagesInPackageJson(path.join(__dirname, '../../../', 'migrations.json'), '11.0.0'),
        workspace_1.addDepsToPackageJson({ 'core-js': '^3.8.3' }, { 'eslint-config-prettier': '8.1.0' }),
        deleteExtendInEslintConfig(),
        (_, ctx) => {
            ctx.logger.info("The dependencies '@nuxtjs/eslint-config' and 'fork-ts-checker-webpack-plugin' are no longer required by @nx-plus/nuxt. If you have no dependency on these packages, you can remove them.");
        },
    ]);
}
exports.default = update;
//# sourceMappingURL=update-11.0.0.js.map