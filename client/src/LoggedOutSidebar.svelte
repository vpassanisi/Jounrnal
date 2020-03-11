<script>
  import { fly, fade } from "svelte/transition";
  import { link } from "svelte-spa-router";
  import dark from "smelte/src/dark.js";
  import Button from "smelte/src/components/Button";

  export let sidebar_show;
  export let sidebar;

  const darkMode = dark();

  function overlay_click(e) {
    if ("close" in e.target.dataset) sidebar();
  }
</script>

<style>
  nav {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    padding: 2rem 0rem 0rem;
    border-left: 1px solid #aaa;
    background: #fff;
    overflow-y: auto;
    width: 16rem;
    z-index: 11;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
</style>

{#if sidebar_show}
  <div
    class="modal-overlay"
    data-close
    on:click={overlay_click}
    transition:fade={{ duration: 150 }} />
  <nav class="dark:bg-dark-500" transition:fly={{ x: -300, opacity: 1 }}>
    <div class="flex items-center justify-center w-full mb-8">
      {#if $darkMode}
        <Button
          flat
          bind:value={$darkMode}
          icon="brightness_low"
          color="blue-500" />
      {:else}
        <Button
          flat
          iconClass="text-black"
          bind:value={$darkMode}
          icon="brightness_high"
          color="blue-500" />
      {/if}
    </div>
    <ul>
      <hr />
      <li class="h-16">
        <a
          class="hover:bg-gray-500 transition duration-100 ease-in-out pl-4 flex
          h-full w-full items-center"
          href="/newUser"
          use:link
          on:click={sidebar()}>
          New Journal
        </a>
      </li>
      <hr />
      <li class="h-16">
        <a
          class="hover:bg-gray-500 transition duration-100 ease-in-out pl-4 flex
          h-full w-full items-center"
          href="/login"
          use:link
          on:click={sidebar()}>
          Login
        </a>
      </li>
      <hr />
      <li class="h-16">
        <a
          class="hover:bg-gray-500 transition duration-100 ease-in-out pl-4 flex
          h-full w-full items-center"
          href="/"
          use:link
          on:click={sidebar()}>
          Info
        </a>
      </li>
      <hr />
    </ul>
  </nav>
{/if}
