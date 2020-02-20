<script>
  import Button from "smelte/src/components/Button";
  import EditModal from "./EditModal.svelte";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";

  export let entry;
  export let i;
  export let deleteEntry;
  export let editEntry;
  let show;
</script>

<li class="flex flex-col bg-white dark:bg-dark-500 p-4 m-8 rounded">
  <div class="font-bold">{entry.subject}</div>
  <hr />
  <div class="mb-4">{entry.description}</div>
  <div class="flex flex-row justify-between items-center">
    <div class="text-xs">
      {new Date(entry.createdAt).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
    </div>
    <div class="flex flex-row">
      <Button on:click={() => (show = true)} add="flex p-2" remove="py-2 px-4">
        <i class="material-icons">edit</i>
      </Button>
      <Button
        add="flex p-2 ml-2"
        remove="py-2 px-4"
        color="pink"
        on:click={deleteEntry(entry._id, i)}>
        <i class="material-icons">clear</i>
      </Button>
    </div>
  </div>
</li>

<EditModal bind:show {editEntry} {entry} {i} />
