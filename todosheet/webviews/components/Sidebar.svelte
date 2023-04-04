<script lang="ts">
	import { onMount } from "svelte"


	let todos: Array<{ text: string; completed: boolean }> = []
	let text = ""

    onMount(() => {
        window.addEventListener("message", (event) => {
            const message = event.data
            switch (message.type) {
                case "new-todo":
                    todos = [{ text: message.value, completed: false }, ...todos]
                    break
            }
        })
    })

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
					console.log("completed: " + todo.completed)
				}}
			>
				{todo.text}
			</button>
		</li>
	{/each}
</ul>

<button
	on:click={() => {
		tsvscode.postMessage({
			type: "onInfo",
			value: "info message",
		})
	}}>Click me</button
>

<button
	on:click={() => {
		tsvscode.postMessage({
			type: "onError",
		    value: "error message",
		})
	}}>Click me</button
>

<style>
	.btn-list {
		background: none;
		outline: none;
	}

	.completed {
		text-decoration: line-through;
	}
</style>
