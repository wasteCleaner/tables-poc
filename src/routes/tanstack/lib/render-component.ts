/**
 * Renders a Svelte component inside a TanStack table cell.
 * Returns a marker object that FlexRender recognizes.
 */

import type { Component } from 'svelte';

const RENDER_COMPONENT_SYMBOL = Symbol('render-component');

export interface RenderComponentConfig<TProps extends Record<string, unknown>> {
	[RENDER_COMPONENT_SYMBOL]: true;
	component: Component<TProps>;
	props: TProps;
}

/** Wrap a Svelte component + props for use in TanStack column defs */
export function renderComponent<TProps extends Record<string, unknown>>(
	component: Component<TProps>,
	props: TProps
): RenderComponentConfig<TProps> {
	return {
		[RENDER_COMPONENT_SYMBOL]: true,
		component,
		props
	};
}

export function isRenderComponentConfig(value: unknown): value is RenderComponentConfig<any> {
	return typeof value === 'object' && value !== null && RENDER_COMPONENT_SYMBOL in value;
}
