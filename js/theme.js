/* Runs in <head> before first paint → no theme flash */
(function () {
  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  var stored;
  try {
    stored = localStorage.getItem("aiw-theme");
  } catch (e) {}
  var initial =
    stored ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.dataset.theme = initial;

  window.aiwTheme = {
    get: function () {
      return root.dataset.theme;
    },
    set: function (value) {
      root.dataset.theme = value;
      try {
        localStorage.setItem("aiw-theme", value);
      } catch (e) {}
      document.dispatchEvent(new CustomEvent("themechange", { detail: value }));
    },
    toggle: function () {
      this.set(root.dataset.theme === "dark" ? "light" : "dark");
    },
  };
})();
