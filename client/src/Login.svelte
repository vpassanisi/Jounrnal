<script>
  import TextField from "smelte/src/components/TextField";
  import Button from "smelte/src/components/Button";
  import { loggedIn } from "./stores/loggedIn.js";
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Snackbar from "smelte/src/components/Snackbar";

  let body = {};
  let errorMsg;
  let showError = false;

  onMount(() => {
    if (localStorage.getItem("token")) {
      push("#/journal");
    }
  });

  const login = async () => {
    document.getElementById("login-loading").classList.remove("hidden");
    const req = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (req.status === 404) {
      showError = true;
      errorMsg = "Resourse not found :(";
      document.getElementById("login-loading").classList.add("hidden");
    }

    const res = await req.json();

    if (res.success) {
      localStorage.setItem("token", JSON.stringify(res.token));
      $loggedIn = true;
      push("#/journal");
    } else {
      showError = true;
      errorMsg = res.error;
    }
    document.getElementById("login-loading").classList.add("hidden");
  };
</script>

<div class="flex flex-col items-center justify-center">
  <div class="text-white font-thin text-3xl">Login</div>
  <div
    class="flex flex-col bg-white dark:bg-dark-500 w-5/6 max-w-lg p-8 m-4
    rounded">
    <TextField outlined label="email" bind:value={body.email} />
    <TextField outlined label="password" bind:value={body.password} />
    <Button
      color="secondary"
      on:click={login}
      add="flex flex-row items-center justify-between h-10">
      <div class="w-2/5" />
      <div class="w-1/5">login</div>
      <div class="w-2/5 h-full flex items-center">
        <svg
          id="login-loading"
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

<Snackbar color="red" top bind:value={showError}>
  <div>{errorMsg}</div>
</Snackbar>
