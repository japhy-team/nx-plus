import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { StaticBuilderSchema } from './schema';
export declare function runBuilder(options: StaticBuilderSchema, context: BuilderContext): Observable<BuilderOutput>;
declare const _default: import("@angular-devkit/architect/src/internal").Builder<StaticBuilderSchema & JsonObject>;
export default _default;
