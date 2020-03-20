<script>
  import Button from "smelte/src/components/Button";
  import TextField from "smelte/src/components/TextField";
  import { push } from "svelte-spa-router";
  import { loggedIn } from "./stores/loggedIn.js";
  import Snackbar from "smelte/src/components/Snackbar";
  import { baseUrl } from "./_baseURL.js";

  let body = {};
  let showError = false;
  let errorMsg;

  const createUser = async () => {
    document.getElementById("loading").classList.remove("hidden");
    const req = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (req.status === 404) {
      showError = true;
      errorMsg = "Resourse not found :(";
      document.getElementById("loading").classList.add("hidden");
    }

    const res = await req.json();

    if (res.success) {
      localStorage.setItem("token", JSON.stringify(res.token));
      push("/journal");
      $loggedIn = true;
    } else {
      showError = true;
      errorMsg = res.error;
    }
    document.getElementById("loading").classList.add("hidden");
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
    <Button color="secondary" on:click={createUser} add="h-10">create</Button>
  </div>
</div>

<Snackbar color="red" top bind:value={showError}>{errorMsg}</Snackbar>
