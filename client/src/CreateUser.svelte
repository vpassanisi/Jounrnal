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
    document.getElementById("create-loading").classList.remove("hidden");
    const req = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (req.status === 404) {
      showError = true;
      errorMsg = "Resourse not found :(";
      document.getElementById("create-loading").classList.add("hidden");
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
    document.getElementById("create-loading").classList.add("hidden");
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
    <Button
      color="secondary"
      on:click={createUser}
      add="flex flex-row items-center justify-between h-10">
      <div class="w-2/5" />
      <div class="w-1/5">Create</div>
      <div class="w-2/5 h-full flex items-center">
        <svg
          id="create-loading"
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

<Snackbar color="red" top bind:value={showError}>{errorMsg}</Snackbar>
