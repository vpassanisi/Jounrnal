<script>
  import Button from "smelte/src/components/Button";
  import Snackbar from "smelte/src/components/Snackbar";
  import { loggedIn } from "./stores/loggedIn.js";
  import { push } from "svelte-spa-router";

  let errorMsg;
  let showError = false;

  const DemoLogin = async () => {
    const req = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "Demo@gmail.com",
        password: "123456"
      })
    });

    if (req.status === 404) {
      showError = true;
      errorMsg = "Resourse not found :(";
      console.log(req);
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
  };
</script>

<style>
  .video_container {
    padding-bottom: 56.25%;
  }
</style>

<div class="flex flex-col justify-center items-center">
  <div
    class="flex flex-col items-center bg-white dark:bg-dark-500 max-w-screen-xl
    my-8 mx-2 p-8 rounded">
    <p class="mb-4">
      This is a journaling app that was inspired by this video about
      dissatisfaction:
      <br />
      <small>The journal is mentioned towards the end</small>
    </p>
    <div class="video_container relative w-full">
      <iframe
        class="absolute top-0 left-0 w-full h-full"
        title="video"
        width="420"
        height="315"
        src="https://www.youtube.com/embed/WPPPFqsECz0" />
    </div>
    <p class="mt-4 mb-4">
      I kept the format of the journal intentionally open ended, with just a
      title and description for each post, so they could be used in any way you
      want. The app is built with Node and Express for the API, Svelte and
      TailwindCSS for the front-end. The documentation for the API can be found
      here:
    </p>
    <Button color="secondary">
      <a href="/docs">API Documentation</a>
    </Button>
    <p class="mt-4 mb-4">
      The front-end is completely responsive, and looks great on any mobile
      device and on desktop. It also has a dark mode toggle. You can make a new
      journal and it will be saved indefinitely, or click the demo button bellow
      to try it out.
    </p>
    <Button on:click={DemoLogin} color="secondary">Demo</Button>
  </div>
</div>

<Snackbar color="red" top bind:value={showError}>
  <div>{errorMsg}</div>
</Snackbar>
