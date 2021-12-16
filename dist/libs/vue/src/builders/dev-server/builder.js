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
const devServerBuilderOverriddenKeys = [
    'mode',
    'skipPlugins',
    'publicPath',
    'css',
    'stdin',
];
function runBuilder(options, context) {
    // The `css` option must be `undefined` in order for the
    // browser builder option to serve as the default. JSON
    // Schema does not support setting a default value of
    // `undefined`.
    // TODO: Handle this less obtrusively.
    if (options.css.requireModuleExtension === undefined &&
        options.css.extract === undefined &&
        options.css.sourceMap === undefined &&
        !Object.keys(options.css.loaderOptions).length) {
        options.css = undefined;
    }
    // https://github.com/angular/angular-cli/blob/v9.1.0/packages/angular_devkit/build_angular/src/dev-server/index.ts#L133
    function setup() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const browserTarget = architect_1.targetFromTargetString(options.browserTarget);
            const rawBrowserOptions = yield context.getTargetOptions(browserTarget);
            const overrides = Object.keys(options)
                .filter((key) => options[key] !== undefined &&
                devServerBuilderOverriddenKeys.includes(key))
                .reduce((previous, key) => (Object.assign(Object.assign({}, previous), { [key]: options[key] })), {});
            const browserName = yield context.getBuilderNameForTarget(browserTarget);
            const browserOptions = yield context.validateOptions(Object.assign(Object.assign({}, rawBrowserOptions), overrides), browserName);
            const projectRoot = yield utils_1.getProjectRoot(context);
            const babelConfig = utils_1.getBabelConfig(projectRoot);
            const inlineOptions = {
                chainWebpack: (config) => {
                    webpack_1.modifyIndexHtmlPath(config, browserOptions, context);
                    webpack_1.modifyEntryPoint(config, browserOptions, context);
                    webpack_1.modifyTsConfigPaths(config, browserOptions, context);
                    webpack_1.modifyCachePaths(config, context);
                    webpack_1.modifyTypescriptAliases(config, browserOptions, context);
                    if (babelConfig) {
                        webpack_1.modifyBabelLoader(config, babelConfig, context);
                    }
                    if (!options.watch) {
                        // There is no option to disable file watching in `webpack-dev-server`,
                        // but webpack's file watcher can be overriden.
                        config.plugin('vue-cli').use({
                            apply: (compiler) => {
                                compiler.hooks.afterEnvironment.tap('vue-cli', () => {
                                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                                    compiler.watchFileSystem = { watch: () => { } };
                                });
                            },
                        });
                    }
                },
                publicPath: browserOptions.publicPath,
                filenameHashing: browserOptions.filenameHashing,
                css: browserOptions.css,
                configureWebpack: utils_1.resolveConfigureWebpack(projectRoot),
                devServer: options.devServer,
                transpileDependencies: options.transpileDependencies,
            };
            return {
                projectRoot,
                browserOptions,
                inlineOptions,
            };
        });
    }
    // The vue-cli build command is not suitable for an nx project.
    // We spy on chalk to intercept the console output and replace
    // it with a nx command.
    // TODO: Find a better way to rewrite vue-cli console output
    const buildRegex = /([p]?npm run|yarn) build/;
    utils_1.modifyChalkOutput('cyan', (arg) => {
        if (buildRegex.test(arg)) {
            return arg.replace(buildRegex, `nx build ${context.target.project} --prod`);
        }
        return arg;
    });
    return rxjs_1.from(setup()).pipe(operators_1.switchMap(({ projectRoot, browserOptions, inlineOptions }) => {
        utils_1.checkUnsupportedConfig(context, projectRoot);
        const service = new Service(core_1.getSystemPath(projectRoot), {
            pkg: resolvePkg(context.workspaceRoot),
            inlineOptions,
        });
        return new rxjs_1.Observable((obs) => {
            service
                .run('serve', {
                open: options.open,
                copy: options.copy,
                stdin: options.stdin,
                mode: browserOptions.mode,
                host: options.host,
                port: options.port,
                https: options.https,
                public: options.public,
                transpileDependencies: options.transpileDependencies,
                'skip-plugins': browserOptions.skipPlugins,
            }, ['serve'])
                .then((success) => obs.next(success))
                .catch((err) => obs.error(err));
        });
    }), operators_1.map(({ url }) => ({ success: true, baseUrl: url })));
}
exports.runBuilder = runBuilder;
exports.default = architect_1.createBuilder(runBuilder);
//# sourceMappingURL=builder.js.map