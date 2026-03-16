<!--
  FlexRender — renders TanStack cell/header content in Svelte 5.
  Handles: string, renderComponent, renderSnippet, and raw snippet types.
-->
<script lang="ts">
  import { type Snippet } from 'svelte';
  import type { CellContext, HeaderContext } from '@tanstack/table-core';
  import { isRenderComponentConfig } from './render-component';
  import { isRenderSnippetConfig } from './render-snippet';

  type Props = {
    content: any;
    context: CellContext<any, any> | HeaderContext<any, any>;
  };

  let { content, context }: Props = $props();

  /** Resolve content: if it's a function (column def header/cell), call it with context */
  let result = $derived(typeof content === 'function' ? content(context) : content);
</script>

{#if typeof result === 'string'}
  {result}
{:else if isRenderComponentConfig(result)}
  {@const Comp = result.component}
  <Comp {...result.props} />
{:else if isRenderSnippetConfig(result)}
  {@render result.snippet(result.props)}
{:else if result}
  <!-- fallback: try rendering as snippet -->
  {@render (result as Snippet)()}
{/if}
