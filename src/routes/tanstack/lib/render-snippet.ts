/**
 * Renders a Svelte 5 snippet inside a TanStack table cell.
 * Returns a marker object that FlexRender recognizes.
 */

import type { Snippet } from 'svelte';

const RENDER_SNIPPET_SYMBOL = Symbol('render-snippet');

export interface RenderSnippetConfig<TProps> {
	[RENDER_SNIPPET_SYMBOL]: true;
	snippet: Snippet<[TProps]>;
	props: TProps;
}

/** Wrap a Svelte snippet + props for use in TanStack column defs */
export function renderSnippet<TProps>(
	snippet: Snippet<[TProps]>,
	props: TProps
): RenderSnippetConfig<TProps> {
	return {
		[RENDER_SNIPPET_SYMBOL]: true,
		snippet,
		props
	};
}

export function isRenderSnippetConfig(value: unknown): value is RenderSnippetConfig<unknown> {
	return typeof value === 'object' && value !== null && RENDER_SNIPPET_SYMBOL in value;
}
