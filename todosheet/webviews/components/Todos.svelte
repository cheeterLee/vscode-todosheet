<script lang="ts">
    import { onMount } from "svelte";
    import type { User } from "../types";

    export let user: User;
    // export let accessToken: string;
    let text = "";
    let todos: Array<{ text: string; completed: boolean; }> = [];

    // async function addTodo(t: string) {
    //     const response = await fetch(`${apiBaseUrl}/todo`, {
    //         method: "POST",
    //         body: JSON.stringify({
    //             text: t,
    //         }),
    //         headers: {
    //             "content-type": "application/json",
    //             authorization: `Bearer ${accessToken}`,
    //         },
    //     });
    //     const { todo } = await response.json();
    //     todos = [todo, ...todos];
    // }

    onMount(async () => {
        window.addEventListener("message", async (event) => {
            const message = event.data;
            // switch (message.type) {
            //     case "new-todo":
            //         addTodo(message.value);
            //         break;
            // }
        });

        // const response = await fetch(`${apiBaseUrl}/todo`, {
        //     headers: {
        //         authorization: `Bearer ${accessToken}`,
        //     },
        // });
        // const payload = await response.json();
        // todos = payload.todos;
    });
</script>

<style>
	.btn-list {
		background: none;
		outline: none;
	}

	.completed {
		text-decoration: line-through;
	}
</style>

<div>Hello 😇, {user.name}</div>

<form
    on:submit|preventDefault={async () => {
        // addTodo(text);
        todos = [{ text, completed: false }, ...todos]
        text = '';
    }}>
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