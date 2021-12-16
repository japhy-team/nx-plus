"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBuilder = void 0;
const tslib_1 = require("tslib");
const architect_1 = require("@angular-devkit/architect");
const core_1 = require("@angular-devkit/core");
const nuxt_1 = require("nuxt");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const utils_1 = require("../../utils");
const webpack_1 = require("../../webpack");
function runBuilder(options, context) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function setup() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const projectRoot = yield utils_1.getProjectRoot(context);
            const nuxt = yield nuxt_1.loadNuxt({
                for: 'build',
                rootDir: core_1.getSystemPath(projectRoot),
                configOverrides: {
                    buildDir: core_1.getSystemPath(core_1.join(core_1.normalize(context.workspaceRoot), options.buildDir, '.nuxt')),
                    build: {
                        extend(config, ctx) {
                            webpack_1.modifyTypescriptAliases(config, projectRoot);
                            // eslint-disable-next-line @typescript-eslint/no-var-requires
                            const { default: nuxtConfig } = require(core_1.getSystemPath(core_1.join(projectRoot, 'nuxt.config.js')));
                            if (nuxtConfig.build && nuxtConfig.build.extend) {
                                nuxtConfig.build.extend(config, ctx);
                            }
                        },
                    },
                },
            });
            return nuxt;
        });
    }
    return rxjs_1.from(setup()).pipe(operators_1.switchMap((nuxt) => rxjs_1.from(nuxt_1.build(nuxt))), operators_1.map(() => ({ success: true })));
}
exports.runBuilder = runBuilder;
exports.default = architect_1.createBuilder(runBuilder);
//# sourceMappingURL=builder.js.map