<script>
  import Writer from "./Writer.svelte";
  import Entries from "./Entries.svelte";
  import Snackbar from "smelte/src/components/Snackbar";
  import { onMount } from "svelte";

  let entries = [];
  let showError = false;
  let errorMsg;

  onMount(async () => {
    const loader = document.getElementById("loader");
    loader.classList.remove("hidden");

    const req = await fetch("/api/v1/entries", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + JSON.parse(localStorage.getItem("token"))
      }
    });

    const res = await req.json();

    if (res.success) {
      res.data.reverse();
      entries = res.data;
    }

    loader.classList.add("hidden");
  });

  const newEntry = async entry => {
    document.getElementById("add-loading").classList.remove("hidden");

    const req = await fetch("/api/v1/entries", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + JSON.parse(localStorage.getItem("token")),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(entry)
    });

    if (req.status === 404) {
      showError = true;
      errorMsg = "Resource not found :(";
      document.getElementById("add-loading").classList.add("hidden");
    }

    const res = await req.json();

    if (res.success) {
      entries = [res.data, ...entries];
    } else {
      showError = true;
      errorMsg = res.error;
    }

    document.getElementById("add-loading").classList.add("hidden");
  };

  const deleteEntry = async (id, i) => {
    const check = confirm("are you sure you want to delete this entry");

    if (!check) return;

    const req = await fetch(`/api/v1/entries/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + JSON.parse(localStorage.getItem("token"))
      }
    });

    const res = await req.json();

    if (res.success) {
      entries.splice(i, 1);
      entries = entries;
    }
  };

  const editEntry = async (entry, id, i) => {
    document.getElementById("edit-loading").classList.remove("hidden");

    const req = await fetch(`/api/v1/entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(entry),
      headers: {
        Authorization: "Bearer " + JSON.parse(localStorage.getItem("token")),
        "Content-Type": "application/json"
      }
    });

    if (req.status === 404) {
      showError = true;
      errorMsg = "Resource not found :(";
      document.getElementById("edit-loading").classList.add("hidden");
    }

    const res = await req.json();

    if (res.success) {
      entries[i] = res.data;
    } else {
      showError = true;
      errorMsg = res.error;
    }
  };
</script>

<div class="flex flex-col lg:flex-row">
  <Writer {newEntry} />
  <Entries {entries} {deleteEntry} {editEntry} />
</div>
<Snackbar color="red" top bind:value={showError}>{errorMsg}</Snackbar>
