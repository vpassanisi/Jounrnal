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
    <Button
      color="secondary"
      on:click={newEntry(entry)}
      add="flex flex-row items-center justify-between h-10">
      <div class="w-2/5" />
      <div class="w-1/5">add</div>
      <div class="w-2/5 h-full flex items-center">
        <svg
          id="add-loading"
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
