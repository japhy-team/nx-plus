"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBuilder = void 0;
const tslib_1 = require("tslib");
const architect_1 = require("@angular-devkit/architect");
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const utils_1 = require("../../utils");
const webpack_1 = require("../../webpack");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Service = require('@vue/cli-service/lib/Service');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolvePkg } = require('@vue/cli-shared-utils/lib/pkg');
function runBuilder(options, context) {
    function setup() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const projectRoot = yield utils_1.getProjectRoot(context);
            const babelConfig = utils_1.getBabelConfig(projectRoot);
            const inlineOptions = {
                chainWebpack: (config) => {
                    webpack_1.modifyIndexHtmlPath(config, options, context);
                    webpack_1.modifyEntryPoint(config, options, context);
                    webpack_1.modifyTsConfigPaths(config, options, context);
                    webpack_1.modifyCachePaths(config, context);
                    webpack_1.modifyTypescriptAliases(config, options, context);
                    if (babelConfig) {
                        webpack_1.modifyBabelLoader(config, babelConfig, context);
                    }
                },
                publicPath: options.publicPath,
                filenameHashing: options.filenameHashing,
                productionSourceMap: options.productionSourceMap,
                css: options.css,
                configureWebpack: utils_1.resolveConfigureWebpack(projectRoot),
                transpileDependencies: options.transpileDependencies,
            };
            return {
                projectRoot,
                inlineOptions,
            };
        });
    }
    // The compiled files output by vue-cli are not relative to the
    // root of the workspace. We can spy on chalk to intercept the
    // console output and tranform any non-relative file paths.
    // TODO: Find a better way to rewrite vue-cli console output
    const chalkTransform = (arg) => {
        const normalizedArg = core_1.normalize(arg);
        return normalizedArg.includes(options.dest)
            ? options.dest + normalizedArg.split(options.dest)[1]
            : arg;
    };
    ['green', 'cyan', 'blue'].forEach((color) => utils_1.modifyChalkOutput(color, chalkTransform));
    return rxjs_1.from(setup()).pipe(operators_1.switchMap(({ projectRoot, inlineOptions }) => {
        utils_1.checkUnsupportedConfig(context, projectRoot);
        const service = new Service(core_1.getSystemPath(projectRoot), {
            pkg: resolvePkg(context.workspaceRoot),
            inlineOptions,
        });
        const buildOptions = {
            mode: options.mode,
            dest: core_1.getSystemPath(core_1.join(core_1.normalize(context.workspaceRoot), options.dest)),
            modern: false,
            'unsafe-inline': true,
            clean: options.clean,
            report: options.report,
            'report-json': options.reportJson,
            'skip-plugins': options.skipPlugins,
            watch: options.watch,
            stdin: options.stdin,
            transpileDependencies: options.transpileDependencies,
        };
        if (options.watch) {
            return new rxjs_1.Observable((obs) => {
                service
                    .run('build', buildOptions, ['build'])
                    .then((success) => obs.next(success))
                    .catch((err) => obs.error(err));
            });
        }
        return rxjs_1.from(service.run('build', buildOptions, ['build']));
    }), operators_1.map(() => ({ success: true })));
}
exports.runBuilder = runBuilder;
exports.default = architect_1.createBuilder(runBuilder);
//# sourceMappingURL=builder.js.map