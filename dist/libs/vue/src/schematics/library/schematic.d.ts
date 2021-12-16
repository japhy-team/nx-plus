import { Rule } from '@angular-devkit/schematics';
import { LibrarySchematicSchema } from './schema';
export declare function librarySchematic(options: LibrarySchematicSchema): Rule;
export default librarySchematic;
export declare const libraryGenerator: (host: import("@nrwl/devkit").Tree, generatorOptions: {
    [k: string]: any;
}) => Promise<any>;
