<script lang="ts">
	let todos: Array<{ text: string; completed: boolean }> = []
	let text = ""
</script>

<form
	on:submit|preventDefault={() => {
		todos = [{ text, completed: false }, ...todos]
		text = ""
	}}
>
	<input bind:value={text} />
</form>

<ul>
	{#each todos as todo (todo.text)}
		<li>
			<button
                class="btn-list {todo.completed ? 'completed' : ''}"
				on:click={() => {
					todo.completed = !todo.completed
                    console.log('completed: ' + todo.completed)
				}}
			>
				{todo.text}
			</button>
		</li>
	{/each}
</ul>

<style>
    .btn-list {
        background: none;
        outline: none;
    }
	
    .completed {
        text-decoration: line-through;
    }

</style>
