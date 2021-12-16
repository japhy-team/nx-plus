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
    const run = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const browserTarget = architect_1.targetFromTargetString(options.browserTarget);
        const rawBrowserOptions = yield context.getTargetOptions(browserTarget);
        const overrides = Object.keys(options)
            .filter((key) => options[key] !== undefined &&
            serverBuilderOverriddenKeys.includes(key))
            .reduce((previous, key) => (Object.assign(Object.assign({}, previous), { [key]: options[key] })), {});
        const browserName = yield context.getBuilderNameForTarget(browserTarget);
        const browserOptions = yield context.validateOptions(Object.assign(Object.assign({}, rawBrowserOptions), overrides), browserName);
        const projectRoot = yield utils_1.getProjectRoot(context);
        const config = yield nuxt_1.loadNuxtConfig({
            configOverrides: {
                dev: false,
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
        const nuxt = new nuxt_1.Nuxt(config);
        yield nuxt.ready();
        const builder = new nuxt_1.Builder(nuxt);
        const generator = new nuxt_1.Generator(nuxt, builder);
        yield generator.generate({ build: false });
    });
    return rxjs_1.concat(architect_1.scheduleTargetAndForget(context, architect_1.targetFromTargetString(options.browserTarget)), new rxjs_1.Observable((obs) => {
        run()
            .then((success) => {
            obs.next(success);
            obs.complete();
        })
            .catch((err) => obs.error(err));
    })).pipe(operators_1.map(() => ({ success: true })));
}
exports.runBuilder = runBuilder;
exports.default = architect_1.createBuilder(runBuilder);
//# sourceMappingURL=builder.js.map