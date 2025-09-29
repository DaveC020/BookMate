document.addEventListener("DOMContentLoaded", () => {
  const panels = {
    default: document.getElementById("default-panel"),
    login: document.getElementById("login-panel"),
    register: document.getElementById("register-panel"),
  };

  const showLoginBtn = document.getElementById("show-login");
  const showRegisterBtn = document.getElementById("show-register");

  function showPanel(name) {
    Object.values(panels).forEach(p => p.classList.remove("active"));
    panels[name].classList.add("active");
  }

  document.getElementById("show-login").addEventListener("click", () => showPanel("login"));
  document.getElementById("show-register").addEventListener("click", () => showPanel("register"));

  document.querySelectorAll(".back").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      showPanel("default");
    });
  });
}); 
