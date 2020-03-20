<script>
  import Entry from "./Entry.svelte";
  import ProgressLinear from "smelte/src/components/progressLinear";

  export let entries = [];
  export let deleteEntry;
  export let editEntry;
</script>

<style>
  @media only screen and (min-width: 1024px) {
    .height {
      height: 95vh;
    }
  }
</style>

<ul class="w-full lg:w-1/2 height lg:overflow-y-scroll">
  {#each entries as entry, i}
    <Entry {entry} {i} {deleteEntry} {editEntry} />
  {/each}
</ul>
