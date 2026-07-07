// ============================================================
// Mongwewarona Visuals — Search functionality
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
    const searchToggle = document.getElementById("searchToggle");
    const searchPanel = document.getElementById("searchPanel");
    const searchInput = document.getElementById("searchInput");
    const searchResults = document.getElementById("searchResults");

    // Toggle search panel visibility
    if (searchToggle && searchPanel) {
        searchToggle.addEventListener("click", function (e) {
            e.stopPropagation();
            searchPanel.classList.toggle("active");
            if (searchPanel.classList.contains("active")) {
                searchInput.focus();
            }
        });
    }

    // Close search when clicking outside
    document.addEventListener("click", function (e) {
        if (searchPanel && !searchPanel.contains(e.target)) {
            searchPanel.classList.remove("active");
        }
    });

    // Search data - index of searchable content
    const searchIndex = [
        { title: "Home", content: "Creative Digital Marketing Agency Elevating brands through visual excellence", url: "index.html#home" },
        { title: "Services", content: "Social Media Management Content Creation Video Editing Web Development", url: "index.html#services" },
        { title: "Social Media Management", content: "Social Media Management service for brand growth and engagement", url: "client.html?service=Social%20Media%20Management" },
        { title: "Content Creation", content: "Content Creation services for photography videography graphics design", url: "client.html?service=Content%20Creation" },
        { title: "Video Editing", content: "Video Editing services for promotional videos corporate content post production", url: "client.html?service=Video%20Editing" },
        { title: "Web Development", content: "Web Development services for responsive websites hosting solutions", url: "client.html?service=Web%20Development" },
        { title: "Client Portal", content: "Sign in to manage your account, request services, and sign contracts", url: "client.html" },
        { title: "Our Creative Solutions", content: "Tap a service to view pricing and request it in the client portal", url: "index.html#services" },
        { title: "Meet Our Team", content: "Thato Mongwewarona Creative Director Gaborone digital solutions", url: "index.html#team" },
        { title: "Connect With Us", content: "Ready to elevate your brand with us Get in Touch", url: "index.html#contact" },
        { title: "Careers", content: "Jobs career opportunities employment openings work with us join our team", url: "client.html" },
        { title: "Contact", content: "Get in touch contact us Gaborone Botswana email message", url: "index.html#contact" }
    ];

    // Handle search input
    if (searchInput && searchResults) {
        searchInput.addEventListener("input", function () {
            const query = searchInput.value.trim().toLowerCase();
            if (query.length < 2) {
                searchResults.innerHTML = "";
                return;
            }

            const results = searchIndex.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.content.toLowerCase().includes(query)
            ).slice(0, 6);

            if (results.length === 0) {
                searchResults.innerHTML = '<div class="search-no-results">No results found. Try searching for services, career opportunities, or contact.</div>';
                return;
            }

            searchResults.innerHTML = results.map(item => `
                <div class="search-result-item" onclick="window.location.href='${item.url}'">
                    <div class="search-result-title">${highlightMatch(item.title, query)}</div>
                    <div class="search-result-snippet">${highlightMatch(item.content.substring(0, 80), query)}</div>
                </div>
            `).join("");
        });
    }

    // Highlight matching text
    function highlightMatch(text, query) {
        const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
        return text.replace(regex, "<strong>$1</strong>");
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
});