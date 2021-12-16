import { Observable } from 'rxjs';
import { LibraryBuilderSchema } from './schema';
import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
export declare function runBuilder(options: LibraryBuilderSchema, context: BuilderContext): Observable<BuilderOutput>;
declare const _default: import("@angular-devkit/architect/src/internal").Builder<LibraryBuilderSchema & import("@angular-devkit/core").JsonObject>;
export default _default;
