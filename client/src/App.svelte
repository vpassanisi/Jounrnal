<script>
  import "smelte/src/tailwind.css";
  import Router from "svelte-spa-router";
  import Info from "./Info.svelte";
  import Login from "./Login.svelte";
  import CreateUser from "./CreateUser.svelte";
  import Journal from "./Journal.svelte";
  import Navbar from "./Navbar.svelte";
  import NotFound from "./NotFound.svelte";

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
    background: url("/Journalll-background.jpg") rgba(255, 0, 191, 0.418) center
      center/cover;
    background-blend-mode: hue;
    position: absolute;
    z-index: -10;
    filter: blur(50px);
    height: 100vh;
    width: 100vw;
    -webkit-transform: translateZ(0);
    -webkit-perspective: 1000;
    -webkit-backface-visibility: hidden;
  }
</style>

<main>
  <div class="bg-img" />
  <Navbar />
  <Router {routes} />
</main>
