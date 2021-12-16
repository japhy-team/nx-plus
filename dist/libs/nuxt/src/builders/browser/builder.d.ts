import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { Observable } from 'rxjs';
import { BrowserBuilderSchema } from './schema';
export declare function runBuilder(options: BrowserBuilderSchema, context: BuilderContext): Observable<BuilderOutput>;
declare const _default: import("@angular-devkit/architect/src/internal").Builder<BrowserBuilderSchema & import("@angular-devkit/core").JsonObject>;
export default _default;
