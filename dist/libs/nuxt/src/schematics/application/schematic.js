"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const workspace_1 = require("@nrwl/workspace");
const ast_utils_1 = require("@nrwl/workspace/src/utils/ast-utils");
const semver = require("semver");
const app_root_1 = require("../../app-root");
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
    return Object.assign(Object.assign({}, options), { name,
        projectName,
        projectRoot,
        projectDirectory,
        parsedTags });
}
function addFiles(options) {
    return schematics_1.mergeWith(schematics_1.apply(schematics_1.url(`./files`), [
        schematics_1.applyTemplates(Object.assign(Object.assign(Object.assign({}, options), workspace_1.names(options.name)), { offsetFromRoot: workspace_1.offsetFromRoot(options.projectRoot) })),
        options.unitTestRunner === 'none'
            ? schematics_1.filter((file) => file !== '/test/Logo.spec.js')
            : schematics_1.noop(),
        schematics_1.move(options.projectRoot),
    ]));
}
function checkPeerDeps(context, options) {
    const expectedVersion = '^12.6.0';
    const unmetPeerDeps = [
        ...(options.e2eTestRunner === 'cypress' ? ['@nrwl/cypress'] : []),
        ...(options.unitTestRunner === 'jest' ? ['@nrwl/jest'] : []),
        '@nrwl/linter',
        '@nrwl/workspace',
    ].filter((dep) => {
        try {
            const { version } = utils_1.loadModule(`${dep}/package.json`, app_root_1.appRootPath, true);
            return !semver.satisfies(version, expectedVersion);
        }
        catch (err) {
            return true;
        }
    });
    if (unmetPeerDeps.length) {
        context.logger.warn(`
You have the following unmet peer dependencies:

${unmetPeerDeps
            .map((dep) => `${dep}@${expectedVersion}\n`)
            .join()
            .split(',')
            .join('')}
@nx-plus/nuxt may not work as expected.
    `);
    }
}
function addEsLint(options) {
    const eslintConfig = {
        env: {
            browser: true,
            node: true,
        },
        extends: [
            '@nuxtjs/eslint-config-typescript',
            'plugin:nuxt/recommended',
            'prettier',
        ],
        parserOptions: {
            extraFileExtensions: ['.vue'],
        },
        rules: {},
    };
    return schematics_1.chain([
        workspace_1.updateWorkspace((workspace) => {
            const { targets } = workspace.projects.get(options.projectName);
            targets.add(Object.assign({ name: 'lint' }, workspace_1.generateProjectLint(options.projectRoot, `${options.projectRoot}/tsconfig.json`, "eslint" /* EsLint */, [`${options.projectRoot}/**/*.{ts,js,vue}`])));
        }),
        workspace_1.addLintFiles(options.projectRoot, "eslint" /* EsLint */, {
            localConfig: eslintConfig,
        }),
        workspace_1.updateJsonInTree(`${options.projectRoot}/.eslintrc.json`, (json) => {
            // Extending the root ESLint config should be the first value in the
            // app's local ESLint config extends array.
            json.extends.unshift(json.extends.pop());
            json.ignorePatterns = [...(json.ignorePatterns || []), '.eslintrc.js'];
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
            supportTsx: false,
            testEnvironment: 'jsdom',
            babelJest: false,
        }),
        workspace_1.updateJsonInTree(`${options.projectRoot}/tsconfig.spec.json`, (json) => {
            json.include.push('**/*.spec.js');
            json.compilerOptions = Object.assign(Object.assign({}, json.compilerOptions), { esModuleInterop: true, allowJs: true, noEmit: true });
            return json;
        }),
        (tree) => {
            const content = core_1.tags.stripIndent `
        module.exports = {
          displayName: '${options.projectName}',
          preset: '${workspace_1.offsetFromRoot(options.projectRoot)}jest.preset.js',
          transform: {
            '.*\\.(vue)$': '@vue/vue2-jest',
            '^.+\\.ts$': 'ts-jest',
          },
          moduleFileExtensions: ['ts', 'js', 'vue', 'json'],
          coverageDirectory: '${workspace_1.offsetFromRoot(options.projectRoot)}coverage/${options.projectRoot}',
          collectCoverageFrom: [
            '<rootDir>/components/**/*.vue',
            '<rootDir>/pages/**/*.vue',
          ],
          moduleNameMapper: {
            '^vue$': 'vue/dist/vue.common.js',
          },
          globals: {
            'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
            'vue-jest': { tsConfig: '${options.projectRoot}/tsconfig.spec.json' },
          },
        };
      `;
            tree.overwrite(`${options.projectRoot}/jest.config.js`, content);
            return tree;
        },
        workspace_1.addDepsToPackageJson({}, {
            '@vue/test-utils': '^1.0.3',
            'babel-core': '^7.0.0-bridge.0',
            '@vue/vue2-jest': '^27.0.0-alpha.1',
        }, true),
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
                .replace(`Welcome to ${options.projectName}!`, options.projectName));
        },
    ]);
}
function default_1(options) {
    return (host, context) => {
        checkPeerDeps(context, options);
        const normalizedOptions = normalizeOptions(host, options);
        return schematics_1.chain([
            workspace_1.updateWorkspace((workspace) => {
                const { targets } = workspace.projects.add({
                    name: normalizedOptions.projectName,
                    root: normalizedOptions.projectRoot,
                    projectType,
                });
                targets.add({
                    name: 'build',
                    builder: '@nx-plus/nuxt:browser',
                    options: {
                        buildDir: `dist/${normalizedOptions.projectRoot}`,
                    },
                    configurations: {
                        production: {},
                    },
                });
                targets.add({
                    name: 'serve',
                    builder: '@nx-plus/nuxt:server',
                    options: {
                        browserTarget: `${normalizedOptions.projectName}:build`,
                        dev: true,
                    },
                    configurations: {
                        production: {
                            browserTarget: `${normalizedOptions.projectName}:build:production`,
                            dev: false,
                        },
                    },
                });
                targets.add({
                    name: 'static',
                    builder: '@nx-plus/nuxt:static',
                    options: {
                        browserTarget: `${normalizedOptions.projectName}:build:production`,
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
            workspace_1.addDepsToPackageJson({
                '@nuxt/typescript-runtime': '^2.0.1',
                'core-js': '^3.8.3',
                nuxt: '2.14.12',
            }, {
                '@nuxtjs/eslint-config-typescript': '^5.0.0',
                '@nuxt/types': '2.14.12',
                '@nuxt/typescript-build': '^2.0.4',
                'eslint-plugin-nuxt': '^2.0.0',
            }, true),
            workspace_1.formatFiles(options),
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=schematic.js.map