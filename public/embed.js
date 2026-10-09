(function () {
  function sessionFrom(script) {
    if (!script) return "";
    return script.getAttribute("data-session") || "";
  }

  function findScript() {
    if (document.currentScript && sessionFrom(document.currentScript)) return document.currentScript;
    var scripts = document.querySelectorAll("script[src*='embed.js']");
    return scripts.length ? scripts[scripts.length - 1] : null;
  }

  var script = findScript();
  var session = sessionFrom(script);
  var origin = window.location.origin;
  if (script && script.src) origin = new URL(script.src, window.location.href).origin;

  function openWindow() {
    if (!session || document.querySelector("[data-fh-window]")) return;
    var frame = document.createElement("div");
    frame.setAttribute("data-fh-window", "");
    frame.style.cssText =
      "position:fixed;inset:0;z-index:2147483000;background:rgba(28,28,28,.45);display:flex;align-items:flex-end;justify-content:center;padding:16px;";
    var panel = document.createElement("div");
    panel.style.cssText =
      "width:min(420px,100%);height:min(720px,100%);background:#f3f0e8;border-radius:28px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(28,28,28,.28);";
    var bar = document.createElement("div");
    bar.style.cssText = "display:flex;justify-content:flex-end;padding:12px 14px 0;";
    var close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    close.setAttribute("aria-label", "Close feedback");
    close.style.cssText = "border:0;background:transparent;color:#1f3d32;font:600 14px sans-serif;cursor:pointer;";
    close.addEventListener("click", function () {
      frame.remove();
    });
    var iframe = document.createElement("iframe");
    iframe.title = "Feedback";
    iframe.src = origin + "/embed?session=" + encodeURIComponent(session);
    iframe.style.cssText = "border:0;flex:1;width:100%;background:#f3f0e8;";
    bar.appendChild(close);
    panel.appendChild(bar);
    panel.appendChild(iframe);
    frame.appendChild(panel);
    document.body.appendChild(frame);
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-fh-open]")) openWindow();
  });
  document.addEventListener("fh-open", openWindow);
})();
