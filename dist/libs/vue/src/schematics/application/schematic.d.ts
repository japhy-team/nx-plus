import { Rule } from '@angular-devkit/schematics';
import { ApplicationSchematicSchema } from './schema';
export declare function applicationSchematic(options: ApplicationSchematicSchema): Rule;
export default applicationSchematic;
export declare const applicationGenerator: (host: import("@nrwl/devkit").Tree, generatorOptions: {
    [k: string]: any;
}) => Promise<any>;
