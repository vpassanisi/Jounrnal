<script>
  import LoggedOutSidebar from "./LoggedOutSidebar.svelte";
  import LoggedInSidebar from "./LoggedInSidebar.svelte";
  import Button from "smelte/src/components/Button";
  import LoggedOutNav from "./LoggedOutNav.svelte";
  import LoggedInNav from "./LoggedInNav.svelte";
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import { loggedIn } from "./stores/loggedIn.js";

  let sidebar_show = false;

  const sidebar = () => {
    sidebar_show = !sidebar_show;
  };

  const logout = () => {
    localStorage.setItem("token", "");
    $loggedIn = false;
    push("/");
  };

  onMount(() => {
    if (localStorage.getItem("token") !== "") $loggedIn = true;
  });
</script>

<nav
  class="top-0 w-screen flex items-center justify-center left-0 z-30 p-0 h-16
  elevation-3 bg-primary-700">
  <div
    class="flex items-center flex-wrap justify-between w-full h-full px-4
    lg:w-5/6">
    <a href="#!" class="text-white font-thin text-2xl">Journal</a>

    {#if $loggedIn}
      <LoggedInNav {logout} {sidebar} />
      <LoggedInSidebar {logout} {sidebar_show} {sidebar} />
    {:else}
      <LoggedOutNav {sidebar} />
      <LoggedOutSidebar {sidebar} {sidebar_show} />
    {/if}
  </div>
</nav>
