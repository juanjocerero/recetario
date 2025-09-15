<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	let {
		page,
		totalPages,
		url
	} = $props<{
		page: number;
		totalPages: number;
		url: URL;
	}>();

	function getPageUrl(pageNumber: number): string {
		const newUrl = new URL(url);
		newUrl.searchParams.set('page', pageNumber.toString());
		return newUrl.toString();
	}
</script>

<div class="flex items-center justify-between">
	<div class="text-sm text-muted-foreground">
		Página {page} de {totalPages}
	</div>
	<div class="flex items-center gap-2">
		<a href={getPageUrl(page - 1)} class:pointer-events-none={page <= 1}>
			<Button variant="outline" disabled={page <= 1}>
				<ChevronLeft class="h-4 w-4" />
				Anterior
			</Button>
		</a>
		<a href={getPageUrl(page + 1)} class:pointer-events-none={page >= totalPages}>
			<Button variant="outline" disabled={page >= totalPages}>
				Siguiente
				<ChevronRight class="h-4 w-4" />
			</Button>
		</a>
	</div>
</div>
