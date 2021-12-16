"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.componentGenerator = exports.componentSchematic = void 0;
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const workspace_1 = require("@nrwl/workspace");
const ngcli_adapter_1 = require("@nrwl/devkit/ngcli-adapter");
function normalizeOptions(host, options) {
    var _a, _b;
    const name = workspace_1.toClassName(options.name);
    const { projectType, sourceRoot } = workspace_1.getProjectConfig(host, options.project);
    // depending on projectType build destination path of component
    const componentPath = projectType === workspace_1.ProjectType.Application
        ? `${sourceRoot}/${workspace_1.toFileName((_a = options.directory) !== null && _a !== void 0 ? _a : '')}`
        : `${sourceRoot}/lib/${workspace_1.toFileName((_b = options.directory) !== null && _b !== void 0 ? _b : '')}`;
    return Object.assign(Object.assign({}, options), { name,
        componentPath });
}
function createComponent(options) {
    return schematics_1.mergeWith(schematics_1.apply(schematics_1.url(`./files`), [
        schematics_1.applyTemplates(Object.assign(Object.assign(Object.assign({}, options), core_1.strings), { toClassName: workspace_1.toClassName })),
        schematics_1.move(options.componentPath),
    ]));
}
function componentSchematic(schema) {
    return (host) => {
        const options = normalizeOptions(host, schema);
        return schematics_1.chain([
            createComponent(options),
            workspace_1.formatFiles({ skipFormat: false }),
        ]);
    };
}
exports.componentSchematic = componentSchematic;
exports.default = componentSchematic;
exports.componentGenerator = ngcli_adapter_1.wrapAngularDevkitSchematic('@nx-plus/vue', 'component');
//# sourceMappingURL=schematic.js.map