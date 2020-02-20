<script>
  import { fade } from "svelte/transition";
  import TextField from "smelte/src/components/TextField";
  import Button from "smelte/src/components/Button";

  function overlay_click(e) {
    if ("close" in e.target.dataset) show = false;
  }

  export let show = false;
  export let editEntry;
  export let entry;
  export let i;
</script>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10;
  }
  .editEntry {
    margin-top: 10vh;
  }
</style>

{#if show}
  <div>
    <div
      class="modal-overlay"
      data-close
      on:click={overlay_click}
      transition:fade={{ duration: 150 }}>
      <div
        class="flex flex-col bg-white dark:bg-dark-500 w-5/6 max-w-2xl p-8
        mx-auto editEntry rounded">
        <div class="font-hairline text-2xl text-center">Edit Entry</div>
        <TextField outlined label="subject" bind:value={entry.subject} />
        <TextField
          outlined
          textarea
          label="description"
          bind:value={entry.description} />
        <Button
          color="secondary"
          on:click={(editEntry(entry, entry._id, i), () => (show = false))}>
          Edit
        </Button>
      </div>
    </div>
  </div>
{/if}
