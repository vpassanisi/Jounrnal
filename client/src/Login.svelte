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
    const req = await fetch("http://localhost:5500/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const res = await req.json();

    if (res.success) {
      localStorage.setItem("token", JSON.stringify(res.token));
      $loggedIn = true;
      push("#/journal");
    } else {
      showError = true;
      errorMsg = res.error;
    }
  };
</script>

<div class="flex flex-col items-center justify-center">
  <div class="text-white font-thin text-3xl">Login</div>
  <div
    class="flex flex-col bg-white dark:bg-dark-500 w-5/6 max-w-lg p-8 m-4
    rounded">
    <TextField outlined label="email" bind:value={body.email} />
    <TextField outlined label="password" bind:value={body.password} />
    <Button color="secondary" on:click={login}>test</Button>
  </div>
</div>

<Snackbar color="red" top bind:value={showError}>
  <div>{errorMsg}</div>
</Snackbar>
