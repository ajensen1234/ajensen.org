/**
 * Type shim for `@retorquere/bibtex-parser` 10.0.1.
 *
 * The published package declares `"types": "./dist/types/index.d.ts"` in its
 * exports map but the 10.0.1 tarball does NOT include the `dist/types/`
 * directory, so TypeScript resolves no declarations
 * ("implicitly has an 'any' type"). This shim mirrors the real shipped
 * declarations from 9.x (subset we use) and stays correct because the runtime
 * behavior we depend on (see src/lib/server/bibtex.ts) was verified against
 * the actual v10 output.
 *
 * Remove this file once a v10 release ships its real types again.
 */
declare module '@retorquere/bibtex-parser' {
	/** Parse errors; rendered with String(e) at the call site. */
	export type ParseError = Record<string, unknown>;

	/** Name-list creators; fields other than these are ignored here. */
	export interface Creator {
		name?: string;
		lastName?: string;
		firstName?: string;
		prefix?: string;
		suffix?: string;
		initial?: string;
	}

	/** Field map. Values are deliberately `unknown` — the parser returns
	 * verbatim fields (e.g. `keywords`) as string arrays. */
	export type Fields = Record<string, unknown>;

	export type Entry = {
		type: string;
		key: string;
		fields: Fields;
		mode: Record<string, string>;
		crossref?: {
			inherited: string[];
			donated: string[];
		};
		input: string;
	};

	export interface Library {
		errors: ParseError[];
		entries: Entry[];
		comments: string[];
		strings: Record<string, string>;
		preamble: string[];
	}

	export interface Options {
		/** Fields the parser must return verbatim (no case protection/cleanup). */
		verbatimFields?: (string | RegExp)[];
		/** langid values treated as English (title-case → sentence-case). */
		english?: string[] | boolean;
	}

	export function parse(input: string, options?: Options): Library;
	export function parseAsync(input: string, options?: Options): Promise<Library>;
}
