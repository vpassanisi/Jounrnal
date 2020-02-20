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

<main>
  <Navbar />
  <Router {routes} />
</main>
