const out = document.getElementById("out");
const btn = document.getElementById("go");

btn.addEventListener("click", async () => {
  btn.disabled = true;
  out.textContent = "Filling…";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Injected each click rather than declared in the manifest, so the tool only
    // ever touches a page the user has explicitly pointed it at.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["data.js", "content.js"],
    });

    const opts = {
      overwrite: document.getElementById("overwrite").checked,
      uploads: document.getElementById("uploads").checked,
    };
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (o) => window.__SWIMS_AUTOFILL_RUN__(o),
      args: [opts],
    });

    const filled = Object.entries(result)
      .filter(([k, v]) => v > 0 && k !== "skipped")
      .map(([k, v]) => `${v} ${k}`)
      .join(", ");
    out.textContent = filled
      ? `Filled ${filled}.` + (result.skipped ? `\n${result.skipped} left alone (already filled).` : "")
      : "Nothing to fill on this page.";
  } catch (e) {
    out.textContent = "Failed: " + (e?.message ?? e);
  } finally {
    btn.disabled = false;
  }
});
