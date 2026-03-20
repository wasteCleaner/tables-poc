<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

	let { children } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				refetchOnWindowFocus: false
			}
		}
	});

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/tanstack', label: 'TanStack Table' },
		{ href: '/tzezar', label: 'Tzezar Datagrid' }
	];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<nav class="border-b border-gray-200 bg-white">
	<div class="mx-auto flex max-w-350 items-center gap-6 px-4 py-3">
		<span class="text-lg font-bold text-gray-900">Tables POC</span>
		{#each links as link}
			<a
				href={link.href}
				class="text-sm font-medium transition-colors
					{$page.url.pathname === link.href ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}"
			>
				{link.label}
			</a>
		{/each}
	</div>
</nav>

<QueryClientProvider client={queryClient}>
	{@render children()}
</QueryClientProvider>
