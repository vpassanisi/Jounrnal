<script>
  import Button from "smelte/src/components/Button";
  import dark from "smelte/src/dark.js";
  import { link, push } from "svelte-spa-router";

  export let sidebar;
  export let logout;

  let darkMode = dark();
</script>

<ul class="h-full hidden lg:flex">
  <li
    class="h-full w-20 hover:bg-primary-500 transition duration-100 ease-in-out">
    <a
      href="/"
      use:link
      on:click={(logout(), push('/'))}
      class="h-full w-full flex justify-center items-center text-white
      cursor-pointer">
      Logout
    </a>
  </li>
  <li
    class="h-full w-20 hover:bg-primary-500 transition duration-100 ease-in-out">
    <a
      href="/journal"
      use:link
      class="h-full w-full flex justify-center items-center text-white">
      Journal
    </a>
  </li>
  <li
    class="h-full w-20 hover:bg-primary-500 transition duration-100 ease-in-out">
    <a
      href="/"
      use:link
      class="h-full w-full flex justify-center items-center text-white">
      Info
    </a>
  </li>
  {#if $darkMode}
    <li class="h-full w-20 flex items-center justify-center">
      <Button
        flat
        bind:value={$darkMode}
        icon="brightness_low"
        color="blue-500" />
    </li>
  {:else}
    <li class="h-full w-20 flex items-center justify-center">
      <Button
        flat
        bind:value={$darkMode}
        icon="brightness_high"
        color="blue-500" />
    </li>
  {/if}
</ul>
<Button
  on:click={sidebar()}
  color="primary-300"
  icon="menu"
  remove="elevation"
  add="h-full lg:hidden mr-2" />
