// ============================================================
// Mongwewarona Visuals — Client Portal logic
// ============================================================
(function () {
    const sb = window.mvSupabase;
    const { jsPDF } = window.jspdf;

    // ---- DOM refs ----
    const authView   = document.getElementById("authView");
    const clientView = document.getElementById("clientView");
    const adminView  = document.getElementById("adminView");

    const tabLogin   = document.getElementById("tabLogin");
    const tabSignup  = document.getElementById("tabSignup");
    const loginForm  = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginMessage  = document.getElementById("loginMessage");
    const signupMessage = document.getElementById("signupMessage");
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");
    const forgotPasswordView = document.getElementById("forgotPasswordView");
    const forgotEmailInput = document.getElementById("forgotEmail");
    const resetPasswordBtn = document.getElementById("resetPasswordBtn");
    const forgotPasswordMessage = document.getElementById("forgotPasswordMessage");
    const backToLogin = document.getElementById("backToLogin");

    const clientWelcome      = document.getElementById("clientWelcome");
    const clientSubtitle     = document.getElementById("clientSubtitle");
    const clientLogoutButton = document.getElementById("clientLogoutButton");

    // Logo upload refs
    const logoPreview      = document.getElementById("logoPreview");
    const logoUploadInput  = document.getElementById("logoUploadInput");
    const logoUploadButton = document.getElementById("logoUploadButton");
    const logoMessage      = document.getElementById("logoMessage");

    const pricingPanel       = document.getElementById("pricingPanel");
    const pricingServiceName = document.getElementById("pricingServiceName");
    const pricingGrid        = document.getElementById("pricingGrid");
    const pricingMessage     = document.getElementById("pricingMessage");
    const closePricingButton = document.getElementById("closePricingButton");

    const contractPanel         = document.getElementById("contractPanel");
    const contractText          = document.getElementById("contractText");
    const signName              = document.getElementById("signName");
    const acceptContractButton  = document.getElementById("acceptContractButton");
    const declineContractButton = document.getElementById("declineContractButton");
    const contractMessage       = document.getElementById("contractMessage");
    const projectGoalCheckboxes = document.querySelectorAll(".portal-goal-checkbox");
    const projectGoalOther      = document.getElementById("projectGoalOther");

    const requestList      = document.getElementById("requestList");
    const clientProjectList = document.getElementById("clientProjectList");

    const adminWelcome      = document.getElementById("adminWelcome");
    const adminLogoutButton = document.getElementById("adminLogoutButton");
    const adminClientCount  = document.getElementById("adminClientCount");
    const adminRequestCount = document.getElementById("adminRequestCount");
    const adminProjectCount = document.getElementById("adminProjectCount");
    const adminClientList   = document.getElementById("adminClientList");
    const adminRequestList  = document.getElementById("adminRequestList");
    const adminProjectList  = document.getElementById("adminProjectList");

    // Use getElementById for all form fields — avoids reserved property name collisions
    const loginEmailInput    = document.getElementById("loginEmail");
    const loginPasswordInput = document.getElementById("loginPassword");
    const signupNameInput    = document.getElementById("signupName");
    const signupEmailInput   = document.getElementById("signupEmail");
    const signupPasswordInput = document.getElementById("signupPassword");

    // ---- State ----
    let currentProfile = null;
    let pendingRequestDraft = null;

    // ---- Init ----
    init();

    async function init() {
        wireStaticEvents();

        // Check for an existing session on page load
        const { data: { session } } = await sb.auth.getSession();
        if (session) {
            await loadProfileAndRender(session.user);
        } else {
            showAuth();
        }

        // Listen for auth changes: login in another tab, email confirmation, logout
        sb.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session) {
                await loadProfileAndRender(session.user);
            }
            if (event === "SIGNED_OUT") {
                currentProfile = null;
                showAuth();
            }
        });
    }

    function wireStaticEvents() {
        tabLogin.addEventListener("click", () => switchTab("login"));
        tabSignup.addEventListener("click", () => switchTab("signup"));
        loginForm.addEventListener("submit", handleLogin);
        signupForm.addEventListener("submit", handleSignup);
        clientLogoutButton.addEventListener("click", handleLogout);
        adminLogoutButton.addEventListener("click", handleLogout);

        forgotPasswordLink.addEventListener("click", showForgotPassword);
        resetPasswordBtn.addEventListener("click", handlePasswordReset);
        backToLogin.addEventListener("click", hideForgotPassword);

        closePricingButton.addEventListener("click", () => {
            pricingPanel.hidden = true;
        });
        declineContractButton.addEventListener("click", () => {
            contractPanel.hidden = true;
            pendingRequestDraft = null;
        });
        acceptContractButton.addEventListener("click", handleAcceptContract);

        projectGoalCheckboxes.forEach(cb => {
            cb.addEventListener("change", () => {
                if (cb.value === "Other") {
                    projectGoalOther.style.display = cb.checked ? "block" : "none";
                    if (!cb.checked) projectGoalOther.value = "";
                }
            });
        });

        document.querySelectorAll(".portal-service-tile").forEach((tile) => {
            tile.addEventListener("click", () => openPricing(tile.dataset.service));
        });

        // Logo upload
        if (logoUploadButton) {
            logoUploadButton.addEventListener("click", () => logoUploadInput.click());
        }
        if (logoUploadInput) {
            logoUploadInput.addEventListener("change", handleLogoUpload);
        }
    }

    function switchTab(which) {
        const isLogin = which === "login";
        tabLogin.classList.toggle("is-active", isLogin);
        tabSignup.classList.toggle("is-active", !isLogin);
        loginForm.hidden  = !isLogin;
        signupForm.hidden = isLogin;
    }

    // ============================================================
    // AUTH — LOGIN
    // ============================================================
    async function handleLogin(event) {
        event.preventDefault();
        const email    = loginEmailInput.value.trim().toLowerCase();
        const password = loginPasswordInput.value;

        if (!email || !password) {
            showMessage("Please enter your email and password.", "error", loginMessage);
            return;
        }

        showMessage("Logging in…", "", loginMessage);
        const { data, error } = await sb.auth.signInWithPassword({ email, password });

        if (error) {
            // Give a friendly message for the most common case
            if (error.message.toLowerCase().includes("invalid login") ||
                error.message.toLowerCase().includes("invalid credentials")) {
                showMessage("Incorrect email or password. Please try again.", "error", loginMessage);
            } else if (error.message.toLowerCase().includes("email not confirmed")) {
                showMessage("Please confirm your email address first — check your inbox.", "warning", loginMessage);
            } else {
                showMessage(error.message, "error", loginMessage);
            }
            return;
        }

        showMessage("Login successful!", "success", loginMessage);
        await loadProfileAndRender(data.user);
    }

    function showForgotPassword(event) {
        event.preventDefault();
        forgotPasswordView.hidden = false;
        forgotPasswordLink.closest(".portal-field").hidden = true;
        clearMessage(forgotPasswordMessage);
    }

    function hideForgotPassword(event) {
        event.preventDefault();
        forgotPasswordView.hidden = true;
        forgotPasswordLink.closest(".portal-field").hidden = false;
        forgotEmailInput.value = "";
    }

    async function handlePasswordReset() {
        const email = forgotEmailInput.value.trim().toLowerCase();
        if (!email) {
            showMessage("Please enter your email address.", "error", forgotPasswordMessage);
            return;
        }
        showMessage("Sending reset link...", "", forgotPasswordMessage);
        const { error } = await sb.auth.resetPasswordForEmail(email);
        if (error) {
            showMessage(error.message, "error", forgotPasswordMessage);
        } else {
            showMessage("Check your email for a password reset link.", "success", forgotPasswordMessage);
            setTimeout(() => {
                hideForgotPassword({ preventDefault: () => {} });
            }, 2000);
        }
    }

    // ============================================================
    // AUTH — SIGN UP
    // ============================================================
    async function handleSignup(event) {
        event.preventDefault();
        const name     = signupNameInput.value.trim();
        const email    = signupEmailInput.value.trim().toLowerCase();
        const password = signupPasswordInput.value;

        if (!name) {
            showMessage("Please enter your full name.", "error", signupMessage);
            return;
        }
        if (!email) {
            showMessage("Please enter your email address.", "error", signupMessage);
            return;
        }
        if (password.length < 6) {
            showMessage("Password must be at least 6 characters.", "error", signupMessage);
            return;
        }

        showMessage("Creating your account…", "", signupMessage);

        const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        });

        if (error) {
            if (error.message.toLowerCase().includes("already registered") ||
                error.message.toLowerCase().includes("user already exists")) {
                showMessage("An account with this email already exists. Try logging in.", "warning", signupMessage);
                switchTab("login");
                loginEmailInput.value = email;
            } else {
                showMessage(error.message, "error", signupMessage);
            }
            return;
        }

        // If Supabase returns a session immediately (email confirmation disabled),
        // create the profile row and go straight to the dashboard.
        if (data.session && data.user) {
            await ensureProfile(data.user.id, name, email);
            showMessage("Account created. Welcome!", "success", signupMessage);
            await loadProfileAndRender(data.user);
            return;
        }

        // Email confirmation is ON — user must confirm before they can log in.
        // Profile row will be created on first login via ensureProfile().
        showMessage(
            "Account created! Check your inbox and confirm your email, then come back to log in.",
            "success",
            signupMessage
        );
        switchTab("login");
        loginEmailInput.value = email;
    }

    // ============================================================
    // PROFILE — ensure row exists (called on login + signup)
    // ============================================================
    async function ensureProfile(userId, name, email) {
        const { data: existing } = await sb
            .from("profiles")
            .select("id")
            .eq("id", userId)
            .maybeSingle();

        if (!existing) {
            await sb.from("profiles").insert({
                id: userId,
                full_name: name || email,
                email,
                role: "client"
            });
        }
    }

    async function handleLogout() {
        await sb.auth.signOut();
        currentProfile = null;
        showAuth();
    }

    // ============================================================
    // ROUTING — load profile and decide which view to show
    // ============================================================
    async function loadProfileAndRender(user) {
        let { data: profile } = await sb
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        // Self-heal: profile row missing
        if (!profile) {
            const fallbackName = user.user_metadata?.full_name || user.email;
            const { data: inserted } = await sb
                .from("profiles")
                .insert({ id: user.id, full_name: fallbackName, email: user.email, role: "client" })
                .select("*")
                .maybeSingle();
            profile = inserted;
        }

        if (!profile) {
            showMessage(
                "Could not load your account. Please try again or contact support.",
                "error",
                loginMessage
            );
            showAuth();
            return;
        }

        currentProfile = profile;
        profile.role === "admin" ? await renderAdmin() : await renderClient();
    }

    function showAuth() {
        authView.hidden  = false;
        clientView.hidden = true;
        adminView.hidden  = true;
        loginForm.reset();
        signupForm.reset();
        clearMessage(loginMessage);
        clearMessage(signupMessage);

        const params = new URLSearchParams(window.location.search);
        const deepLinkService = params.get("service");
        if (deepLinkService) {
            switchTab("signup");
            showMessage(
                `Create an account or log in to see ${deepLinkService} pricing.`,
                "warning",
                signupMessage
            );
        }
    }

    // ============================================================
    // CLIENT DASHBOARD
    // ============================================================
    async function renderClient() {
        authView.hidden  = true;
        adminView.hidden  = true;
        clientView.hidden = false;

        clientWelcome.textContent  = `Welcome, ${currentProfile.full_name}`;
        clientSubtitle.textContent = currentProfile.email;

        pricingPanel.hidden  = true;
        contractPanel.hidden = true;

        await renderLogoSection();
        await renderClientRequests();
        await renderClientProjects();

        const params = new URLSearchParams(window.location.search);
        const deepLinkService = params.get("service");
        if (deepLinkService) await openPricing(deepLinkService);
    }

    // ---- SIGNED URL HELPER ----
    // The storage bucket is private, so every file access (logo previews,
    // project downloads) must go through a short-lived signed URL instead
    // of a permanent public link. Nobody can view/download a file just by
    // guessing or reusing a URL.
    async function getSignedUrl(path, downloadFilename) {
        if (!path) return null;
        const { data, error } = await sb.storage
            .from("mongwewaronavisuals")
            .createSignedUrl(path, 300, downloadFilename ? { download: downloadFilename } : undefined); // 5 min

        if (error || !data) return null;
        return data.signedUrl;
    }

    // ---- LOGO SECTION ----
    async function renderLogoSection() {
        if (!logoPreview) return;
        if (currentProfile.logo_path) {
            const url = await getSignedUrl(currentProfile.logo_path);
            if (url) {
                logoPreview.src = url;
                logoPreview.hidden = false;
            } else {
                logoPreview.hidden = true;
            }
        } else {
            logoPreview.hidden = true;
        }
        clearMessage(logoMessage);
    }

    async function handleLogoUpload() {
        const file = logoUploadInput.files[0];
        if (!file) return;

        const maxMB = 2;
        if (file.size > maxMB * 1024 * 1024) {
            showMessage(`Logo must be under ${maxMB}MB.`, "error", logoMessage);
            logoUploadInput.value = "";
            return;
        }

        const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
        if (!allowed.includes(file.type)) {
            showMessage("Please upload a PNG, JPG, SVG, or WebP image.", "error", logoMessage);
            logoUploadInput.value = "";
            return;
        }

        showMessage("Uploading your logo…", "", logoMessage);
        logoUploadButton.disabled = true;

        // Unique file path: client-logos/<userId>/<timestamp>.<ext>
        const ext  = file.name.split(".").pop();
        const path = `client-logos/${currentProfile.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await sb.storage
            .from("mongwewaronavisuals")
            .upload(path, file, { upsert: true, contentType: file.type });

        if (uploadError) {
            showMessage("Upload failed: " + uploadError.message, "error", logoMessage);
            logoUploadButton.disabled = false;
            logoUploadInput.value = "";
            return;
        }

        // Bucket is private now — store the path, not a permanent public URL.
        const { error: updateError } = await sb
            .from("profiles")
            .update({ logo_path: path })
            .eq("id", currentProfile.id);

        if (updateError) {
            showMessage("Logo uploaded but could not save it: " + updateError.message, "warning", logoMessage);
        } else {
            currentProfile.logo_path = path;
            const previewUrl = await getSignedUrl(path);
            if (previewUrl) {
                logoPreview.src    = previewUrl;
                logoPreview.hidden = false;
            }
            showMessage("Logo uploaded successfully!", "success", logoMessage);
        }

        logoUploadButton.disabled = false;
        logoUploadInput.value = "";
    }

    // ---- PRICING ----
    async function openPricing(service) {
        pricingServiceName.textContent = service;
        pricingPanel.hidden  = false;
        contractPanel.hidden = true;
        pricingGrid.innerHTML = "<p class=\"portal-note\">Loading packages…</p>";
        clearMessage(pricingMessage);

        const { data: packages, error } = await sb
            .from("service_packages")
            .select("*")
            .eq("service", service)
            .order("sort_order", { ascending: true });

        if (error) {
            pricingGrid.innerHTML = "";
            showMessage("Could not load pricing: " + error.message, "error", pricingMessage);
            return;
        }

        if (!packages || !packages.length) {
            pricingGrid.innerHTML = "<p class=\"portal-note\">No packages configured yet — check back soon.</p>";
            return;
        }

        pricingGrid.innerHTML = packages.map((pkg) => `
            <div class="portal-pricing-card">
                <h4>${escapeHtml(pkg.package_name)}</h4>
                <div class="price">P${Number(pkg.price_pula).toLocaleString()}${pkg.starting_from ? "+" : ""} <span>/ ${escapeHtml(pkg.billing_cycle)}</span></div>
                <p class="portal-note" style="margin:0 0 0.5rem;">${escapeHtml(pkg.description)}</p>
                <ul>${(pkg.features || []).map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
                <button class="btn btn-accent" type="button" data-package-id="${pkg.id}"><span>Request this package</span></button>
            </div>
        `).join("");

        pricingGrid.querySelectorAll("button[data-package-id]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const pkg = packages.find((p) => p.id === btn.dataset.packageId);
                draftContract(pkg);
            });
        });

        pricingPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function draftContract(pkg) {
        const contractStr = mvBuildContractText({
            clientName:   currentProfile.full_name,
            service:      pkg.service,
            packageName:  pkg.package_name,
            pricePula:    Number(pkg.price_pula).toLocaleString(),
            billingCycle: pkg.billing_cycle,
            projectGoals: []
        });

        pendingRequestDraft       = { packageRow: pkg, contractStr };
        contractText.textContent  = contractStr;
        signName.value            = "";
        clearMessage(contractMessage);
        contractPanel.hidden      = false;
        contractPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function getSelectedProjectGoals() {
        const goals = [];
        projectGoalCheckboxes.forEach(cb => {
            if (cb.checked) {
                if (cb.value === "Other") {
                    const otherVal = projectGoalOther.value.trim();
                    if (otherVal) goals.push("Other: " + otherVal);
                } else {
                    goals.push(cb.value);
                }
            }
        });
        return goals;
    }

    async function handleAcceptContract() {
        if (!pendingRequestDraft) return;
        const name = signName.value.trim();
        if (!name) {
            showMessage("Type your full name to sign.", "error", contractMessage);
            return;
        }

        const goals = getSelectedProjectGoals();
        const pkg = pendingRequestDraft.packageRow;

        const updatedContractStr = mvBuildContractText({
            clientName:   currentProfile.full_name,
            service:      pkg.service,
            packageName:  pkg.package_name,
            pricePula:    Number(pkg.price_pula).toLocaleString(),
            billingCycle: pkg.billing_cycle,
            projectGoals: goals
        });

        acceptContractButton.disabled = true;
        showMessage("Submitting your request…", "", contractMessage);

        const { data: requestRow, error: requestError } = await sb
            .from("service_requests")
            .insert({
                client_id:    currentProfile.id,
                package_id:   pkg.id,
                service:      pkg.service,
                package_name: pkg.package_name,
                price_pula:   pkg.price_pula,
                status:       "contract_sent"
            })
            .select("*")
            .single();

        if (requestError) {
            showMessage("Could not create request: " + requestError.message, "error", contractMessage);
            acceptContractButton.disabled = false;
            return;
        }

        const { error: contractError } = await sb.from("contracts").insert({
            request_id:         requestRow.id,
            client_id:          currentProfile.id,
            contract_text:      updatedContractStr,
            status:             "signed",
            client_signed_name: name,
            signed_at:          new Date().toISOString()
        });

        if (contractError) {
            showMessage("Request created, but contract save failed: " + contractError.message, "warning", contractMessage);
        } else {
            showMessage("Request submitted and agreement signed! Downloading your invoice…", "success", contractMessage);
            await generateAndDownloadInvoice(requestRow);
        }

        acceptContractButton.disabled = false;
        pendingRequestDraft = null;

        projectGoalCheckboxes.forEach(cb => { cb.checked = false; });
        projectGoalOther.value = "";
        projectGoalOther.style.display = "none";

        setTimeout(async () => {
            contractPanel.hidden = true;
            pricingPanel.hidden  = true;
            await renderClientRequests();
        }, 1400);
    }

    async function renderClientRequests() {
        const { data: requests, error } = await sb
            .from("service_requests")
            .select("*")
            .eq("client_id", currentProfile.id)
            .order("created_at", { ascending: false });

        if (error || !requests || !requests.length) {
            requestList.innerHTML = `<li class="portal-project"><h4>No requests yet</h4><p>Pick a service above to request a package.</p></li>`;
            return;
        }

        requestList.innerHTML = requests.map((r) => `
            <li class="portal-project">
                <div class="portal-project-top">
                    <h4>${escapeHtml(r.service)} &mdash; ${escapeHtml(r.package_name)}</h4>
                    <span class="portal-status ${r.status}">${formatStatus(r.status)}</span>
                </div>
                <p><strong>Price:</strong> P${Number(r.price_pula).toLocaleString()}</p>
                <p><strong>Requested:</strong> ${formatDate(r.created_at)}</p>
            </li>
        `).join("");
    }

    async function renderClientProjects() {
        const { data: projects, error } = await sb
            .from("projects")
            .select("*")
            .eq("client_id", currentProfile.id)
            .order("created_at", { ascending: false });

        if (error || !projects || !projects.length) {
            clientProjectList.innerHTML = `<li class="portal-project"><h4>No active projects</h4><p>Once a request is accepted by our team, it will appear here with live progress.</p></li>`;
            return;
        }

        clientProjectList.innerHTML = projects.map((p) => `
            <li class="portal-project" data-project-id="${p.id}">
                <div class="portal-project-top">
                    <h4>${escapeHtml(p.title)}</h4>
                    <span class="portal-status ${p.status.replace(/\s+/g, "-")}">${escapeHtml(p.status)}</span>
                </div>
                <p><strong>Service:</strong> ${escapeHtml(p.service)}</p>
                <p><strong>Due:</strong> ${formatDate(p.due_date)}</p>
                ${p.notes ? `<p>${escapeHtml(p.notes)}</p>` : ""}
                <div class="portal-progress-track">
                    <div class="portal-progress-fill" style="width:${p.progress_percent}%"></div>
                </div>
                <p style="margin-top:0.35rem;font-size:0.88rem;color:#4b5563;">${p.progress_percent}% complete</p>
                ${(p.deliverable_path || p.deliverable_url) ? `
                <button class="btn btn-accent btn-sm" type="button" data-action="download-deliverable"
                    data-path="${escapeHtml(p.deliverable_path || "")}"
                    data-legacy-url="${escapeHtml(p.deliverable_path ? "" : (p.deliverable_url || ""))}"
                    data-name="${escapeHtml(p.deliverable_name || "")}"
                    style="margin-top:0.6rem;">
                    <span>Download project${p.deliverable_name ? `: ${escapeHtml(p.deliverable_name)}` : ""}</span>
                </button>` : ""}
            </li>
        `).join("");

        clientProjectList.querySelectorAll("button[data-action='download-deliverable']").forEach((btn) => {
            btn.addEventListener("click", async () => {
                btn.disabled = true;
                const path = btn.dataset.path;
                const legacyUrl = btn.dataset.legacyUrl;
                let url = null;
                if (path) {
                    url = await getSignedUrl(path, btn.dataset.name || undefined);
                } else if (legacyUrl) {
                    url = legacyUrl; // old rows created before the bucket was made private
                }
                btn.disabled = false;
                if (!url) {
                    alert("Could not generate a download link. Please try again.");
                    return;
                }
                window.open(url, "_blank", "noopener");
            });
        });
    }

    // Kept temporarily for backwards compatibility if referenced elsewhere;
    // downloads now go through getSignedUrl() since the bucket is private.
    async function getDownloadUrl(path, filename) {
        return getSignedUrl(path, filename);
    }

    // ============================================================
    // ADMIN DASHBOARD
    // ============================================================
    async function renderAdmin() {
        authView.hidden  = true;
        clientView.hidden = true;
        adminView.hidden  = false;

        adminWelcome.textContent = `Welcome, ${currentProfile.full_name}`;

        const [clientsRes, requestsRes, projectsRes] = await Promise.all([
            sb.from("profiles").select("*").eq("role", "client").order("created_at", { ascending: false }),
            sb.from("service_requests").select("*, profiles!service_requests_client_id_fkey(full_name, email)").order("created_at", { ascending: false }),
            sb.from("projects").select("*, profiles!projects_client_id_fkey(full_name, email)").order("created_at", { ascending: false })
        ]);

        const clients  = clientsRes.data  || [];
        const requests = requestsRes.data || [];
        const projects = projectsRes.data || [];

        adminClientCount.textContent  = clients.length;
        adminRequestCount.textContent = requests.length;
        adminProjectCount.textContent = projects.length;

        await renderAdminClients(clients);
        renderAdminRequests(requests);
        await renderAdminProjects(projects);
    }

    async function renderAdminClients(clients) {
        if (!clients.length) {
            adminClientList.innerHTML = `<li class="portal-project"><h4>No client accounts yet</h4></li>`;
            return;
        }
        const clientsWithLogos = await Promise.all(clients.map(async (c) => ({
            ...c,
            logoSignedUrl: c.logo_path ? await getSignedUrl(c.logo_path) : null
        })));

        adminClientList.innerHTML = clientsWithLogos.map((c) => `
            <li class="portal-project">
                <div class="portal-project-top">
                    <h4>${escapeHtml(c.full_name)}</h4>
                    ${c.logoSignedUrl ? `<img src="${escapeHtml(c.logoSignedUrl)}" alt="Logo" style="height:2.5rem;object-fit:contain;border-radius:6px;">` : ""}
                </div>
                <p>${escapeHtml(c.email)}</p>
                <p style="font-size:0.85rem;color:#6b7280;">Joined: ${formatDate(c.created_at)}</p>
            </li>
        `).join("");
    }

    function renderAdminRequests(requests) {
        if (!requests.length) {
            adminRequestList.innerHTML = `<li class="portal-project"><h4>No service requests yet</h4></li>`;
            return;
        }

        adminRequestList.innerHTML = requests.map((r) => `
            <li class="portal-project" data-request-id="${r.id}">
                <div class="portal-project-top">
                    <h4>${escapeHtml(r.service)} &mdash; ${escapeHtml(r.package_name)}</h4>
                    <span class="portal-status ${r.status}">${formatStatus(r.status)}</span>
                </div>
                <p><strong>Client:</strong> ${escapeHtml(r.profiles?.full_name || "Unknown")} (${escapeHtml(r.profiles?.email || "")})</p>
                <p><strong>Price:</strong> P${Number(r.price_pula).toLocaleString()}</p>
                <p><strong>Requested:</strong> ${formatDate(r.created_at)}</p>
                <div class="portal-admin-controls">
                    ${r.status !== "in_progress" && r.status !== "completed"
                        ? `<button class="btn btn-accent btn-sm" data-action="convert" type="button"><span>Accept &amp; create project</span></button>` : ""}
                    ${r.status !== "declined" && r.status !== "in_progress" && r.status !== "completed"
                        ? `<button class="btn btn-outline btn-sm" data-action="decline" type="button"><span>Decline</span></button>` : ""}
                </div>
            </li>
        `).join("");

        adminRequestList.querySelectorAll("button[data-action='convert']").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const li = e.target.closest("li[data-request-id]");
                const req = requests.find((r) => r.id === li.dataset.requestId);
                convertRequestToProject(req);
            });
        });

        adminRequestList.querySelectorAll("button[data-action='decline']").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
                const li = e.target.closest("li[data-request-id]");
                await sb.from("service_requests").update({ status: "declined" }).eq("id", li.dataset.requestId);
                await renderAdmin();
            });
        });
    }

    async function convertRequestToProject(request) {
        await sb.from("service_requests").update({ status: "in_progress" }).eq("id", request.id);
        await sb.from("projects").insert({
            client_id:        request.client_id,
            request_id:       request.id,
            service:          request.service,
            title:            `${request.service} — ${request.package_name}`,
            status:           "Pending",
            progress_percent: 0,
            notes:            "Project created from accepted request."
        });
        await renderAdmin();
    }

    async function renderAdminProjects(projects) {
        if (!projects.length) {
            adminProjectList.innerHTML = `<li class="portal-project"><h4>No projects yet</h4><p>Accept a service request above to create one.</p></li>`;
            return;
        }

        adminProjectList.innerHTML = projects.map((p) => `
            <li class="portal-project" data-project-id="${p.id}">
                <div class="portal-project-top">
                    <h4>${escapeHtml(p.title)}</h4>
                    <span class="portal-status ${p.status.replace(/\s+/g, "-")}">${escapeHtml(p.status)}</span>
                </div>
                <p><strong>Client:</strong> ${escapeHtml(p.profiles?.full_name || "Unknown")} (${escapeHtml(p.profiles?.email || "")})</p>
                <div class="portal-progress-track">
                    <div class="portal-progress-fill" style="width:${p.progress_percent}%"></div>
                </div>
                <div class="portal-admin-controls">
                    <select data-field="status">
                        ${["Pending","In progress","In review","Complete"].map((s) =>
                            `<option value="${s}"${s === p.status ? " selected" : ""}>${s}</option>`
                        ).join("")}
                    </select>
                    <input type="number" min="0" max="100" data-field="progress" value="${p.progress_percent}" style="width:5.5rem;">
                    <input type="date" data-field="due_date" value="${p.due_date || ""}">
                    <button class="btn btn-accent btn-sm" data-action="save" type="button"><span>Save</span></button>
                </div>
                <div class="portal-admin-controls" style="margin-top:0.5rem;">
                    <input type="file" data-field="deliverable-file" style="max-width:14rem;">
                    <button class="btn btn-outline btn-sm" data-action="upload-deliverable" type="button"><span>${p.deliverable_path ? "Replace file" : "Attach file"}</span></button>
                    ${p.deliverable_path ? `<button type="button" data-action="download-current" data-path="${escapeHtml(p.deliverable_path)}" data-name="${escapeHtml(p.deliverable_name || "")}" style="font-size:0.85rem;background:none;border:none;color:var(--accent,#2563eb);text-decoration:underline;cursor:pointer;padding:0;">${escapeHtml(p.deliverable_name || "Current file")}</button>` : `<span class="portal-note" style="margin:0;">No file attached yet</span>`}
                </div>
                ${p.deliverable_path ? `
                <div class="portal-admin-controls" style="margin-top:0.5rem;">
                    <button class="btn btn-accent btn-sm" data-action="send-to-client" type="button"><span>${p.sent_at ? "Re-send email to client" : "Send to client"}</span></button>
                    ${p.sent_at ? `<span class="portal-note" style="margin:0;">Sent ${formatDate(p.sent_at)}</span>` : `<span class="portal-note" style="margin:0;">Client can already see/download this — click Send to also email them.</span>`}
                </div>` : ""}
                <div class="portal-message" data-role="deliverable-message" aria-live="polite"></div>
            </li>
        `).join("");

        adminProjectList.querySelectorAll("button[data-action='download-current']").forEach((btn) => {
            btn.addEventListener("click", async () => {
                btn.disabled = true;
                const url = await getSignedUrl(btn.dataset.path, btn.dataset.name || undefined);
                btn.disabled = false;
                if (!url) {
                    alert("Could not generate a download link. Please try again.");
                    return;
                }
                window.open(url, "_blank", "noopener");
            });
        });

        adminProjectList.querySelectorAll("button[data-action='upload-deliverable']").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
                const li          = e.target.closest("li[data-project-id]");
                const fileInput   = li.querySelector("[data-field='deliverable-file']");
                const messageEl   = li.querySelector("[data-role='deliverable-message']");
                const file        = fileInput.files[0];

                if (!file) {
                    showMessage("Choose a file first.", "error", messageEl);
                    return;
                }

                const maxMB = 500;
                if (file.size > maxMB * 1024 * 1024) {
                    showMessage(`File must be under ${maxMB}MB. For bigger files, share a Google Drive / WeTransfer link in the project notes instead.`, "error", messageEl);
                    return;
                }

                showMessage("Uploading…", "", messageEl);
                btn.disabled = true;

                const path = `project-files/${li.dataset.projectId}/${Date.now()}_${file.name}`;
                const { error: uploadError } = await sb.storage
                    .from("mongwewaronavisuals")
                    .upload(path, file, { upsert: true, contentType: file.type });

                if (uploadError) {
                    showMessage("Upload failed: " + uploadError.message, "error", messageEl);
                    btn.disabled = false;
                    return;
                }

                let { error: updateError } = await sb.from("projects").update({
                    deliverable_path: path,
                    deliverable_name: file.name,
                    sent_at:          null,
                    updated_at:       new Date().toISOString()
                }).eq("id", li.dataset.projectId);

                // Fallback: if deliverable_path/sent_at columns don't exist yet
                // (migration not run), still save the basic filename so the
                // client isn't left with nothing.
                if (updateError && /column .* does not exist/i.test(updateError.message)) {
                    const retry = await sb.from("projects").update({
                        deliverable_name: file.name,
                        updated_at:       new Date().toISOString()
                    }).eq("id", li.dataset.projectId);
                    updateError = retry.error;
                    if (!updateError) {
                        showMessage("File attached, but run supabase_migration_send_and_downloads.sql for downloads + send-to-client to fully work.", "warning", messageEl);
                        btn.disabled = false;
                        await renderAdmin();
                        return;
                    }
                }

                if (updateError) {
                    showMessage("File uploaded but could not save link: " + updateError.message, "error", messageEl);
                    btn.disabled = false;
                    return;
                }

                showMessage("File attached. Click \"Send to client\" below to notify them by email.", "success", messageEl);
                await renderAdmin();
            });
        });

        adminProjectList.querySelectorAll("button[data-action='send-to-client']").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
                const li        = e.target.closest("li[data-project-id]");
                const messageEl = li.querySelector("[data-role='deliverable-message']");

                showMessage("Sending email to client…", "", messageEl);
                btn.disabled = true;

                const { error: fnError } = await sb.functions.invoke("send-project-notification", {
                    body: { project_id: li.dataset.projectId }
                });

                if (fnError) {
                    showMessage("Could not send email: " + fnError.message, "error", messageEl);
                    btn.disabled = false;
                    return;
                }

                await sb.from("projects").update({
                    sent_at: new Date().toISOString()
                }).eq("id", li.dataset.projectId);

                showMessage("Client emailed successfully!", "success", messageEl);
                await renderAdmin();
            });
        });

        adminProjectList.querySelectorAll("button[data-action='save']").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
                const li       = e.target.closest("li[data-project-id]");
                const status   = li.querySelector("[data-field='status']").value;
                const progress = Math.max(0, Math.min(100, Number(li.querySelector("[data-field='progress']").value)));
                const dueDate  = li.querySelector("[data-field='due_date']").value || null;

                btn.disabled = true;
                await sb.from("projects").update({
                    status,
                    progress_percent: progress,
                    due_date:         dueDate,
                    updated_at:       new Date().toISOString()
                }).eq("id", li.dataset.projectId);
                await renderAdmin();
            });
        });
    }

    async function generateAndDownloadInvoice(requestRow) {
        try {
            const doc = new jsPDF();
            const invoiceNo = "INV-" + String(requestRow.id).slice(0, 8).toUpperCase();
            const issueDate = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });

            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(204, 0, 0);
            doc.text("Mongwewarona Visuals", 14, 22);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(51, 0, 0);
            doc.text("Gaborone, Botswana", 14, 28);
            doc.text("mongwewaronat07@gmail.com", 14, 34);

            doc.setDrawColor(204, 0, 0);
            doc.line(14, 40, 196, 40);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(51, 0, 0);
            doc.text("INVOICE", 14, 50);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Invoice No: ${invoiceNo}`, 14, 60);
            doc.text(`Issue Date: ${issueDate}`, 14, 66);
            doc.text(`Status: Paid`, 14, 72);

            doc.text("Bill To:", 14, 84);
            doc.setFont("helvetica", "bold");
            doc.text(currentProfile.full_name, 14, 90);
            doc.setFont("helvetica", "normal");
            doc.text(currentProfile.email, 14, 96);

            doc.setDrawColor(200, 200, 200);
            doc.line(14, 104, 196, 104);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Description", 14, 112);
            doc.text("Amount (Pula)", 160, 112);
            doc.line(14, 115, 196, 115);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            const desc = `${requestRow.service} — ${requestRow.package_name}`;
            doc.text(desc, 14, 123);
            doc.text(`P ${Number(requestRow.price_pula).toLocaleString()}`, 160, 123);

            doc.line(14, 130, 196, 130);

            doc.setFont("helvetica", "bold");
            doc.text("Total:", 140, 138);
            doc.setFontSize(12);
            doc.text(`P ${Number(requestRow.price_pula).toLocaleString()}`, 160, 138);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text("Thank you for choosing Mongwewarona Visuals.", 14, 155);
            doc.text("For any inquiries, contact us at mongwewaronat07@gmail.com", 14, 161);

            doc.save(`Mongwewarona-Invoice-${invoiceNo}.pdf`);
        } catch (err) {
            console.error("Invoice generation failed:", err);
        }
    }

    // ============================================================
    // HELPERS
    // ============================================================
    function showMessage(msg, type, el) {
        if (!el) return;
        el.textContent = msg;
        el.className   = `portal-message${type ? " " + type : ""}`;
    }

    function clearMessage(el) {
        if (!el) return;
        el.textContent = "";
        el.className   = "portal-message";
    }

    function formatStatus(s) {
        return String(s).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    function formatDate(val) {
        if (!val) return "—";
        const d = new Date(val);
        return isNaN(d) ? val : d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
    }

    function escapeHtml(val) {
        return String(val ?? "").replace(/[&<>"']/g, (c) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])
        );
    }
})();
