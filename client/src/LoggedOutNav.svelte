<script>
  import Button from "smelte/src/components/Button";
  import { link } from "svelte-spa-router";
  import dark from "smelte/src/dark.js";

  export let sidebar;

  const darkMode = dark();
</script>

<ul class="h-full hidden lg:flex">
  <li
    class="h-full w-32 hover:bg-primary-500 transition duration-100 ease-in-out">
    <a
      href="/newUser"
      use:link
      class="h-full w-full flex justify-center items-center text-white">
      New Journal
    </a>
  </li>
  <li
    class="h-full w-20 hover:bg-primary-500 transition duration-100 ease-in-out">
    <a
      href="/login"
      use:link
      class="h-full w-full flex justify-center items-center text-white">
      Login
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
