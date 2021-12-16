"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyTypescriptAliases = void 0;
const core_1 = require("@angular-devkit/core");
const tsconfig_paths_webpack_plugin_1 = require("tsconfig-paths-webpack-plugin");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function modifyTypescriptAliases(config, projectRoot) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options = {
        configFile: core_1.getSystemPath(core_1.join(projectRoot, 'tsconfig.json')),
        extensions: [...config.resolve.extensions, '.ts', '.tsx'],
    };
    if (config.resolve.mainFields) {
        options.mainFields = config.resolve.mainFields;
    }
    config.resolve.plugins = [
        ...(config.resolve.plugins || []),
        new tsconfig_paths_webpack_plugin_1.default(options),
    ];
}
exports.modifyTypescriptAliases = modifyTypescriptAliases;
//# sourceMappingURL=webpack.js.map