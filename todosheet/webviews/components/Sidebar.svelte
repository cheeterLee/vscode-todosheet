<script lang='ts'>
    let todos: Array<{ text: string, completed: boolean }> = []
    let text = ''
</script>
<style>
</style>

<form on:submit|preventDefault={() => {
    todos = [{ text, completed: false }, ...todos]
    text = ''
}}>
    <input bind:value={text} />
</form>

<pre>
    {JSON.stringify(todos, null, 2)}
</pre>