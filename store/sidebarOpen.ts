import { defineStore } from "pinia";

/**
 * Open/closed state for the collapsible sidebar groups.
 *
 * The menu behaves as an accordion at every level: the set of open groups is
 * always exactly one path down the tree, so opening a group closes whatever
 * else was open beside it. That keeps the sidebar short enough to read at a
 * glance instead of growing past the viewport.
 *
 * Groups are keyed by their path through the menu ("/Settings/មណ្ឌល"), not by
 * name: leaf names like "បញ្ជី" and "ចុះឈ្មោះ" repeat under several groups.
 * Both the main and the bottom sidebar share this store; their paths keep them
 * distinct, which is also what makes the accordion span both.
 *
 * A missing key means closed, so a fresh login starts fully collapsed.
 */
export const useSidebarOpenStore = defineStore(
  "sidebarOpen",
  () => {
    const open = ref<Record<string, boolean>>({});

    const isOpen = (key: string) => open.value[key] === true;

    /** Open `key` and every ancestor of it, and nothing else. "" closes all. */
    function openPath(key: string) {
      const next: Record<string, boolean> = {};
      let acc = "";
      for (const part of key.split("/").filter(Boolean)) {
        acc += `/${part}`;
        next[acc] = true;
      }
      open.value = next;
    }

    function toggle(key: string) {
      // Closing falls back to the parent path, so a group collapses without
      // also collapsing the group it sits inside.
      openPath(isOpen(key) ? key.slice(0, key.lastIndexOf("/")) : key);
    }

    /**
     * Reveal the group containing the current route.
     *
     * Every ancestor of the active page runs this, in no guaranteed order, so
     * a shallower group must not overwrite a deeper one that already claimed
     * the path — hence the check for an open descendant.
     */
    function revealPath(key: string) {
      const deeperAlreadyOpen = Object.keys(open.value).some(
        (k) => k.startsWith(`${key}/`) && open.value[k]
      );
      if (!deeperAlreadyOpen) openPath(key);
    }

    return { open, isOpen, toggle, revealPath };
  },
  {
    persist: true,
  }
);
