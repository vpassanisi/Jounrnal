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
          on:click={(editEntry(entry, entry._id, i), () => (show = false))}
          add="flex flex-row items-center justify-between h-10">
          <div class="w-2/5" />
          <div class="w-1/5">edit</div>
          <div class="w-2/5 h-full flex items-center">
            <svg
              id="edit-loading"
              viewBox="0 0 50 50"
              style="enable-background:new 0 0 50 50;"
              class="hidden inline-block h-full w-6">
              <path
                fill="#fff"
                d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z">
                <animateTransform
                  attributeType="xml"
                  attributeName="transform"
                  type="rotate"
                  from="0 25 25"
                  to="360 25 25"
                  dur="0.6s"
                  repeatCount="indefinite" />
              </path>
            </svg>
          </div>
        </Button>
      </div>
    </div>
  </div>
{/if}
