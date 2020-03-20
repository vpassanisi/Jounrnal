<script>
  import TextField from "smelte/src/components/TextField";
  import Button from "smelte/src/components/Button";

  export let newEntry;
  let entry = {};
</script>

<div class=" lg:w-1/2 flex flex-col items-center m-8">
  <div class="text-white font-hairline text-2xl">New Entry</div>
  <div
    class="w-full flex flex-col bg-white dark:bg-dark-500 max-w-2xl p-8 mt-4
    rounded">
    <TextField outlined label="subject" bind:value={entry.subject} />
    <TextField
      outlined
      textarea
      label="description"
      bind:value={entry.description} />
    <Button color="secondary" on:click={newEntry(entry)} add="h-10">add</Button>
  </div>
</div>
