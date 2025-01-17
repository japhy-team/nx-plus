import { BuilderContext } from '@angular-devkit/architect';
import { Path } from '@angular-devkit/core';
import { SchematicContext } from '@angular-devkit/schematics';
export declare function getProjectRoot(context: BuilderContext): Promise<Path>;
export declare function modifyChalkOutput(method: string, transform: (arg: string) => string): void;
export declare function checkUnsupportedConfig(context: BuilderContext, projectRoot: Path): void;
export declare function resolveConfigureWebpack(projectRoot: string): any;
export declare function loadModule(request: any, context: any, force?: boolean): any;
export declare function checkPeerDeps(context: SchematicContext, options: any): void;
export declare function getBabelConfig(projectRoot: string): string;
