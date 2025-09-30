document.addEventListener("DOMContentLoaded", () => {
  const eye = () => `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7ZM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
    </svg>`;
  const eyeOff = () => `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M3 4.27 4.28 3 21 19.72 19.73 21l-2.3-2.3A12.7 12.7 0 0 1 12 19c-5 0-9-4.5-10-7a17 17 0 0 1 5.03-5.67L3 4.27Zm5.38 5.38A5 5 0 0 0 12 17a5 5 0 0 0 2.77-.86l-1.51-1.51A2.5 2.5 0 0 1 9.88 12c0-.34.07-.66.2-.95l-1.7-1.4ZM12 5c5 0 9 4.5 10 7-.48 1.2-1.42 2.64-2.77 3.98l-1.42-1.43A11 11 0 0 0 21 12c-1-2.5-5-7-10-7-1.06 0-2.07.17-3.02.5l-1.5-1.23C8.1 5.09 10 5 12 5Z"/>
    </svg>`;

  document.querySelectorAll('input[data-toggle="pw"]').forEach((input) => {
    // Use existing wrapper if present; otherwise create one
    const wrap = input.closest(".pw-wrap") || (() => {
      const w = document.createElement("div");
      w.className = "pw-wrap";
      input.parentNode.insertBefore(w, input);
      w.appendChild(input);
      return w;
    })();

    // Avoid duplicate button
    if (wrap.querySelector(".pw-toggle")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pw-toggle";
    btn.setAttribute("aria-label", "Show password");
    btn.innerHTML = eye(); // start with hidden state (password type)
    wrap.appendChild(btn);

    btn.addEventListener("click", () => {
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
      btn.classList.toggle("on", !showing);
      btn.innerHTML = showing ? eye() : eyeOff(); // swap icon
      input.focus();
    });
  });
});