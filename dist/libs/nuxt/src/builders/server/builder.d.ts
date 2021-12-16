import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { ServerBuilderSchema } from './schema';
export declare function runBuilder(options: ServerBuilderSchema, context: BuilderContext): Observable<BuilderOutput>;
declare const _default: import("@angular-devkit/architect/src/internal").Builder<ServerBuilderSchema & JsonObject>;
export default _default;
