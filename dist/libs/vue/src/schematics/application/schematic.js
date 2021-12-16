"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationGenerator = exports.applicationSchematic = void 0;
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const workspace_1 = require("@nrwl/workspace");
const ast_utils_1 = require("@nrwl/workspace/src/utils/ast-utils");
const ngcli_adapter_1 = require("@nrwl/devkit/ngcli-adapter");
const utils_1 = require("../../utils");
/**
 * Depending on your needs, you can change this to either `Library` or `Application`
 */
const projectType = workspace_1.ProjectType.Application;
function normalizeOptions(host, options) {
    const name = workspace_1.toFileName(options.name);
    const projectDirectory = options.directory
        ? `${workspace_1.toFileName(options.directory)}/${name}`
        : name;
    const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
    const projectRoot = core_1.normalize(`${ast_utils_1.appsDir(host)}/${projectDirectory}`);
    const parsedTags = options.tags
        ? options.tags.split(',').map((s) => s.trim())
        : [];
    const isVue3 = options.vueVersion === 3;
    return Object.assign(Object.assign({}, options), { name,
        projectName,
        projectRoot,
        projectDirectory,
        parsedTags,
        isVue3 });
}
function addFiles(options) {
    return schematics_1.mergeWith(schematics_1.apply(schematics_1.url(`./files`), [
        schematics_1.applyTemplates(Object.assign(Object.assign(Object.assign({}, options), workspace_1.names(options.name)), { offsetFromRoot: workspace_1.offsetFromRoot(options.projectRoot), dot: '.', baseUrl: '<%= BASE_URL %>', htmlWebpackPluginTitle: '<%= htmlWebpackPlugin.options.title %>' })),
        options.unitTestRunner === 'none'
            ? schematics_1.filter((file) => file !== '/tests/unit/example.spec.ts')
            : schematics_1.noop(),
        options.routing
            ? schematics_1.noop()
            : schematics_1.filter((file) => ![
                '/src/router/index.ts',
                '/src/views/About.vue',
                '/src/views/Home.vue',
            ].includes(file)),
        options.isVue3
            ? schematics_1.filter((file) => file !== '/src/shims-tsx.d.ts')
            : schematics_1.noop(),
        schematics_1.move(options.projectRoot),
    ]));
}
function getEslintConfig(options) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eslintConfig = {
        extends: [
            `plugin:vue/${options.isVue3 ? 'vue3-' : ''}essential`,
            '@vue/typescript/recommended',
            'prettier',
        ],
        rules: {},
        env: {
            node: true,
        },
    };
    if (options.unitTestRunner === 'jest') {
        eslintConfig.overrides = [
            {
                files: ['**/*.spec.{j,t}s?(x)'],
                env: {
                    jest: true,
                },
            },
        ];
    }
    return eslintConfig;
}
function addEsLint(options) {
    return schematics_1.chain([
        workspace_1.updateWorkspace((workspace) => {
            const { targets } = workspace.projects.get(options.projectName);
            targets.add(Object.assign({ name: 'lint' }, workspace_1.generateProjectLint(options.projectRoot, `${options.projectRoot}/tsconfig.app.json`, "eslint" /* EsLint */, [`${options.projectRoot}/**/*.{ts,tsx,vue}`])));
        }),
        workspace_1.addLintFiles(options.projectRoot, "eslint" /* EsLint */, {
            localConfig: getEslintConfig(options),
        }),
        // Extending the root ESLint config should be the first value in the
        // app's local ESLint config extends array.
        workspace_1.updateJsonInTree(`${options.projectRoot}/.eslintrc.json`, (json) => {
            json.extends.unshift(json.extends.pop());
            return json;
        }),
        (tree) => {
            const configPath = `${options.projectRoot}/.eslintrc.json`;
            const content = tree.read(configPath).toString('utf-8').trim();
            const newConfigPath = configPath.slice(0, -2);
            tree.rename(configPath, newConfigPath);
            tree.overwrite(newConfigPath, `module.exports = ${content};`);
        },
    ]);
}
function addJest(options) {
    return schematics_1.chain([
        workspace_1.addPackageWithInit('@nrwl/jest'),
        schematics_1.externalSchematic('@nrwl/jest', 'jest-project', {
            project: options.projectName,
            setupFile: 'none',
            skipSerializers: true,
            supportTsx: true,
            testEnvironment: 'jsdom',
            babelJest: false,
        }),
        workspace_1.updateJsonInTree(`${options.projectRoot}/tsconfig.spec.json`, (json) => {
            json.include = json.include.filter((pattern) => !/\.jsx?$/.test(pattern));
            if (!options.isVue3) {
                json.compilerOptions = Object.assign(Object.assign({}, json.compilerOptions), { jsx: 'preserve', esModuleInterop: true, allowSyntheticDefaultImports: true });
            }
            return json;
        }),
        (tree) => {
            const content = core_1.tags.stripIndent `
        module.exports = {
          displayName: '${options.projectName}',
          preset: '${workspace_1.offsetFromRoot(options.projectRoot)}jest.preset.js',
          transform: {
            '^.+\\.vue$': '${options.isVue3 ? 'vue3-jest' : '@vue/vue2-jest'}',
            '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$':
              'jest-transform-stub',
            '^.+\\.tsx?$': 'ts-jest',
          },
          moduleFileExtensions: ["ts", "tsx", "vue", "js", "json"],
          coverageDirectory: '${workspace_1.offsetFromRoot(options.projectRoot)}coverage/${options.projectRoot}',
          snapshotSerializers: ['jest-serializer-vue'],
          globals: {
            'ts-jest': {
              tsconfig: '<rootDir>/tsconfig.spec.json',
              ${options.babel ? `babelConfig: '<rootDir>/babel.config.js',` : ''}
            },
            'vue-jest': {
              tsConfig: '${options.projectRoot}/tsconfig.spec.json',
              ${options.babel
                ? `babelConfig: '${options.projectRoot}/babel.config.js',`
                : ''}
            }
          },
        };
      `;
            tree.overwrite(`${options.projectRoot}/jest.config.js`, content);
            return tree;
        },
        workspace_1.addDepsToPackageJson({}, Object.assign({ '@vue/test-utils': options.isVue3 ? '^2.0.0-0' : '^1.0.3', 'babel-core': '^7.0.0-bridge.0', 'jest-serializer-vue': '^2.0.2', 'jest-transform-stub': '^2.0.0' }, (options.isVue3
            ? { 'vue3-jest': '^27.0.0-alpha.1' }
            : { '@vue/vue2-jest': '^27.0.0-alpha.1' })), true),
    ]);
}
function addCypress(options) {
    return schematics_1.chain([
        workspace_1.addPackageWithInit('@nrwl/cypress'),
        schematics_1.externalSchematic('@nrwl/cypress', 'cypress-project', {
            project: options.projectName,
            name: options.name + '-e2e',
            directory: options.directory,
            linter: "eslint" /* EsLint */,
            js: false,
        }),
        (tree) => {
            const appSpecPath = options.projectRoot + '-e2e/src/integration/app.spec.ts';
            tree.overwrite(appSpecPath, tree
                .read(appSpecPath)
                .toString('utf-8')
                .replace(`Welcome to ${options.projectName}!`, 'Welcome to Your Vue.js + TypeScript App'));
        },
    ]);
}
function addPostInstall() {
    return workspace_1.updateJsonInTree('package.json', (json, context) => {
        const vuePostInstall = 'node node_modules/@nx-plus/vue/patch-nx-dep-graph.js';
        const { postinstall } = json.scripts || {};
        if (postinstall) {
            if (postinstall !== vuePostInstall) {
                context.logger.warn("We couldn't add our postinstall script. Without it Nx's dependency graph won't support Vue files. For more information see https://github.com/ZachJW34/nx-plus/tree/master/libs/vue#nx-dependency-graph-support");
            }
            return json;
        }
        json.scripts = Object.assign(Object.assign({}, json.scripts), { postinstall: vuePostInstall });
        return json;
    });
}
function addBabel(options) {
    const babelConfigPath = `${options.projectRoot}/babel.config.js`;
    return schematics_1.chain([
        (tree) => tree.create(babelConfigPath, core_1.tags.stripIndent `
          module.exports = {
            presets: ["@vue/cli-plugin-babel/preset"]
          };`),
        workspace_1.addDepsToPackageJson({ 'core-js': '^3.6.5' }, { '@vue/cli-plugin-babel': '~4.5.0' }),
    ]);
}
function applicationSchematic(options) {
    return (host, context) => {
        utils_1.checkPeerDeps(context, options);
        const normalizedOptions = normalizeOptions(host, options);
        return schematics_1.chain([
            workspace_1.updateWorkspace((workspace) => {
                const { targets } = workspace.projects.add({
                    name: normalizedOptions.projectName,
                    root: normalizedOptions.projectRoot,
                    sourceRoot: `${normalizedOptions.projectRoot}/src`,
                    projectType,
                });
                targets.add({
                    name: 'build',
                    builder: '@nx-plus/vue:browser',
                    options: {
                        dest: `dist/${normalizedOptions.projectRoot}`,
                        index: `${normalizedOptions.projectRoot}/public/index.html`,
                        main: `${normalizedOptions.projectRoot}/src/main.ts`,
                        tsConfig: `${normalizedOptions.projectRoot}/tsconfig.app.json`,
                    },
                    configurations: {
                        production: {
                            mode: 'production',
                            filenameHashing: true,
                            productionSourceMap: true,
                            css: {
                                extract: true,
                                sourceMap: false,
                            },
                        },
                    },
                });
                targets.add({
                    name: 'serve',
                    builder: '@nx-plus/vue:dev-server',
                    options: {
                        browserTarget: `${normalizedOptions.projectName}:build`,
                    },
                    configurations: {
                        production: {
                            browserTarget: `${normalizedOptions.projectName}:build:production`,
                        },
                    },
                });
            }),
            workspace_1.addProjectToNxJsonInTree(normalizedOptions.projectName, {
                tags: normalizedOptions.parsedTags,
            }),
            addFiles(normalizedOptions),
            addEsLint(normalizedOptions),
            options.unitTestRunner === 'jest' ? addJest(normalizedOptions) : schematics_1.noop(),
            options.e2eTestRunner === 'cypress'
                ? addCypress(normalizedOptions)
                : schematics_1.noop(),
            options.babel ? addBabel(normalizedOptions) : schematics_1.noop(),
            addPostInstall(),
            workspace_1.addDepsToPackageJson(Object.assign({ vue: normalizedOptions.isVue3 ? '^3.0.0' : '^2.6.11' }, (options.routing
                ? { 'vue-router': normalizedOptions.isVue3 ? '^4.0.0-0' : '^3.2.0' }
                : {})), Object.assign(Object.assign(Object.assign({ '@vue/cli-plugin-typescript': '~4.5.0', '@vue/cli-service': '~4.5.0' }, (normalizedOptions.isVue3
                ? { '@vue/compiler-sfc': '^3.0.0' }
                : {})), { '@vue/eslint-config-typescript': '^5.0.2', 'eslint-plugin-vue': '^7.8.0' }), (!normalizedOptions.isVue3
                ? { 'vue-template-compiler': '^2.6.11' }
                : {})), true),
            workspace_1.formatFiles(options),
        ]);
    };
}
exports.applicationSchematic = applicationSchematic;
exports.default = applicationSchematic;
exports.applicationGenerator = ngcli_adapter_1.wrapAngularDevkitSchematic('@nx-plus/vue', 'application');
//# sourceMappingURL=schematic.js.map