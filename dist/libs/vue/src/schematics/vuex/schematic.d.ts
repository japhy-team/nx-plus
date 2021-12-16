import { Rule } from '@angular-devkit/schematics';
import { VuexSchematicSchema } from './schema';
export declare function vuexSchematic(options: VuexSchematicSchema): Rule;
export default vuexSchematic;
export declare const vuexGenerator: (host: import("@nrwl/devkit").Tree, generatorOptions: {
    [k: string]: any;
}) => Promise<any>;
