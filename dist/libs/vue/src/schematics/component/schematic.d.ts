import { Rule } from '@angular-devkit/schematics';
import { ComponentSchematicSchema } from './schema';
export declare function componentSchematic(schema: ComponentSchematicSchema): Rule;
export default componentSchematic;
export declare const componentGenerator: (host: import("@nrwl/devkit").Tree, generatorOptions: {
    [k: string]: any;
}) => Promise<any>;
