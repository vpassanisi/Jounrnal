<script>
  import Button from "smelte/src/components/Button";
  import TextField from "smelte/src/components/TextField";
  import { push } from "svelte-spa-router";
  import { loggedIn } from "./stores/loggedIn.js";
  import Snackbar from "smelte/src/components/Snackbar";

  let body = {};
  let showError = false;
  let errorMsg;

  const createUser = async () => {
    const req = await fetch("http://localhost:5500/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const res = await req.json();

    if (res.success) {
      push("/journal");
      $loggedIn = true;
    } else {
      showError = true;
      errorMsg = res.error;
    }
  };
</script>

<div class="flex flex-col items-center justify-center">
  <div class="text-white font-thin text-3xl">New User</div>
  <div
    class="flex flex-col bg-white dark:bg-dark-500 w-5/6 max-w-lg p-8 m-4
    rounded">
    <TextField outlined label="name" bind:value={body.name} />
    <TextField outlined label="email" bind:value={body.email} />
    <TextField outlined label="password" bind:value={body.password} />
    <Button color="secondary" on:click={createUser}>test</Button>
  </div>
</div>

<Snackbar color="red" top bind:value={showError}>{errorMsg}</Snackbar>
