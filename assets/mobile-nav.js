// ============================================================
// Mongwewarona Visuals — Mobile menu functionality
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("mobileMenuToggle");
    const menuClose = document.getElementById("mobileMenuClose");
    const menuOverlay = document.getElementById("mobileMenuOverlay");

    if (!menuToggle || !menuOverlay) return;

    function openMenu() {
        menuOverlay.classList.add("is-active");
        document.body.style.overflow = "hidden";
    }

    function closeMenu() {
        menuOverlay.classList.remove("is-active");
        document.body.style.overflow = "";
    }

    menuToggle.addEventListener("click", openMenu);
    if (menuClose) menuClose.addEventListener("click", closeMenu);

    // Close when a link inside the menu is tapped
    menuOverlay.querySelectorAll(".navigation-mobile-link").forEach(function (link) {
        link.addEventListener("click", closeMenu);
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeMenu();
    });
});
