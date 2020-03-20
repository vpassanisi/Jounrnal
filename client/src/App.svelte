<script>
  import "smelte/src/tailwind.css";
  import Router from "svelte-spa-router";
  import Info from "./Info.svelte";
  import Login from "./Login.svelte";
  import CreateUser from "./CreateUser.svelte";
  import Journal from "./Journal.svelte";
  import Navbar from "./Navbar.svelte";
  import NotFound from "./NotFound.svelte";
  import ProgressLinear from "smelte/src/components/ProgressLinear";

  const routes = {
    "/": Info,
    "/login": Login,
    "/newUser": CreateUser,
    "/journal": Journal,
    "*": NotFound
  };
</script>

<style>
  .bg-img {
    /* background: url("/Journalll-background.jpg") rgba(255, 0, 191, 0.418) center
      center/cover; */
    /* background-blend-mode: hue; */
    /* filter: blur(50px); */
    background: url("/Journal-bg.jpg") center center/cover;
    position: absolute;
    z-index: -10;
    height: 100vh;
    width: 100vw;
  }
</style>

<main>
  <div id="loading" class="absolute w-screen mt-16 hidden">
    <ProgressLinear color="secondary" />
  </div>
  <div class="bg-img" />
  <Navbar />
  <Router {routes} />
</main>
