<script lang="ts">
	import { onMount } from "svelte"
	import type { User } from "../types"
	import Todos from "./Todos.svelte"

	let accessToken = ""
	let todos: Array<{ text: string; completed: boolean }> = []
	let text = ""
	let loading = true
	let user: User | null = null

	onMount(async () => {
		window.addEventListener("message", async (event) => {
			const message = event.data
			switch (message.type) {
				case "token":
					accessToken = message.value
					const response = await fetch(`${apiBaseUrl}/me`, {
						headers: {
							authorization: `Bearer ${accessToken}`,
						},
					})
					const data = await response.json()
					user = data.user
					loading = false
			}
		})
		tsvscode.postMessage({ type: "get-token", value: undefined })
	})
</script>

{#if loading}
	<div>Loading... :)</div>
{:else if user}
	<Todos {user} {accessToken} />
	<button on:click={() => {
		accessToken = ""
		user = null
		tsvscode.postMessage({ type: 'logout', value: undefined })
	}}> Logout </button>
{:else}
	<button on:click={() => {
		tsvscode.postMessage({ type: 'authenticate', value: undefined })
	}}> Login with github </button>
{/if}


<!-- 
<form
	on:submit|preventDefault={() => {
		todos = [{ text, completed: false }, ...todos]
		text = ""
	}}
>
	<input bind:value={text} />
</form> -->
<!-- 
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
</ul> -->

<!-- <button
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
> -->

<!-- <style>
	.btn-list {
		background: none;
		outline: none;
	}

	.completed {
		text-decoration: line-through;
	}
</style> -->
