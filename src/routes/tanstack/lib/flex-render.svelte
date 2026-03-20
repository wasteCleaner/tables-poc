<!--
  FlexRender — renders TanStack cell/header content in Svelte 5.
  Handles: string, renderComponent, renderSnippet, and raw snippet types.
-->
<script lang="ts" generics="TData extends RowData, TValue = unknown">
  import type { Snippet } from 'svelte';
  import type { CellContext, HeaderContext, RowData } from '@tanstack/table-core';
  import { isRenderComponentConfig } from './render-component';
  import { isRenderSnippetConfig } from './render-snippet';

  type Props = {
    content: unknown;
    context: CellContext<TData, TValue> | HeaderContext<TData, TValue>;
  };

  let { content, context }: Props = $props();

  /** Resolve content: if it's a function (column def header/cell), call it with context */
  let result = $derived(
    typeof content === 'function'
      ? (content as (ctx: CellContext<TData, TValue> | HeaderContext<TData, TValue>) => unknown)(context)
      : content
  );
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
  {@const snip = result as Snippet}
  {@render snip()}
{/if}
