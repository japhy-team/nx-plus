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
const serverBuilderOverriddenKeys = [];
function runBuilder(options, context) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function setup() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const browserTarget = architect_1.targetFromTargetString(options.browserTarget);
            const rawBrowserOptions = yield context.getTargetOptions(browserTarget);
            const overrides = Object.keys(options)
                .filter((key) => options[key] !== undefined &&
                serverBuilderOverriddenKeys.includes(key))
                .reduce((previous, key) => (Object.assign(Object.assign({}, previous), { [key]: options[key] })), {});
            const browserName = yield context.getBuilderNameForTarget(browserTarget);
            const browserOptions = yield context.validateOptions(Object.assign(Object.assign({}, rawBrowserOptions), overrides), browserName);
            const projectRoot = yield utils_1.getProjectRoot(context);
            const nuxt = yield nuxt_1.loadNuxt({
                for: options.dev ? 'dev' : 'start',
                rootDir: core_1.getSystemPath(projectRoot),
                configOverrides: {
                    buildDir: core_1.getSystemPath(core_1.join(core_1.normalize(context.workspaceRoot), browserOptions.buildDir, '.nuxt')),
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
    return rxjs_1.from(setup()).pipe(operators_1.switchMap((nuxt) => options.dev
        ? rxjs_1.concat(new rxjs_1.Observable((obs) => {
            nuxt_1.build(nuxt)
                .then((success) => obs.next(success))
                .catch((err) => obs.error(err));
        }), rxjs_1.from(nuxt.listen(nuxt.options.server.port)))
        : new rxjs_1.Observable((obs) => {
            nuxt
                .listen(nuxt.options.server.port)
                .then((success) => obs.next(success))
                .catch((err) => obs.error(err));
        })), 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operators_1.map((result) => {
        const baseUrl = options.dev
            ? result.nuxt.server.listeners[0].url
            : result.url;
        context.logger.info(`\nListening on: ${baseUrl}\n`);
        return {
            success: true,
            baseUrl,
        };
    }));
}
exports.runBuilder = runBuilder;
exports.default = architect_1.createBuilder(runBuilder);
//# sourceMappingURL=builder.js.map