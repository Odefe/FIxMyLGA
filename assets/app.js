(() => {
    "use strict";
    const menuButton = document.getElementById("mobile-menu-button");
    const menuPanel = document.getElementById("mobile-nav-panel");
    const closeMenu = (restoreFocus = false) => {
        if (!menuButton || !menuPanel) return;
        menuPanel.hidden = true;
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open menu");
        if (restoreFocus) menuButton.focus();
    };
    if (menuButton && menuPanel) {
        menuButton.addEventListener("click", () => {
            const isOpen = !menuPanel.hidden;
            menuPanel.hidden = isOpen;
            menuButton.setAttribute("aria-expanded", String(!isOpen));
            menuButton.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
        });
        menuPanel.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !menuPanel.hidden) closeMenu(true);
        });
        window.addEventListener("resize", () => { if (window.innerWidth > 1100) closeMenu(); });
    }
    const records = [
        {id: "jabi", title: "Water logged road with poor drainage beside Jabi Lake Mall, Jabi, Abuja", category: "Flooding & Drainage", state: "Federal Capital Territory", lga: "Abuja Municipal", image: "jabi-drainage-1.jpg", href: "issue-jabi.html"},
        {href: "issue-oluwaga-bus-stop.html", id: "oluwaga", title: "Oluwaga Bus Stop horrible dirt road", category: "Waste & Sanitation", state: "Lagos", lga: "Alimosho", image: "oluwaga-bus-stop.jpg"},
        {href: "issue-gaduwa-flooding.html", id: "gaduwa", title: "Massive Flooding in Gaduwa, Abuja", category: "Flooding & Drainage", state: "Federal Capital Territory", lga: "Abuja Municipal", image: "gaduwa-flooding.jpg"},
        {href: "issue-isaac-john-waste.html", id: "isaac-john", title: "Dirt by the side of the Road in Isaac John Street, Somolu.", category: "Waste & Sanitation", state: "Lagos", lga: "Shomolu", image: "isaac-john-waste.jpg"},
        {href: "issue-garki-bridge.html", id: "garki", title: "The bridge by Garki Hospital requires urgent attention", category: "Roads", state: "Federal Capital Territory", lga: "Abuja Municipal", image: "garki-bridge.jpg"},
        {href: "issue-gogon-gada-road.html", id: "gogon-gada", title: "Muddy, waterlogged road in Gogon Gada Village", category: "Roads", state: "Federal Capital Territory", lga: "Abuja Municipal", image: "gogon-gada-road.jpg"},
        {id: "eti-osa-flood", title: "Flooding in Eti-Osa", category: "Other", state: "Lagos", lga: "Eti-Osa", href: "lga-eti-osa.html"}
    ];
    const node = (tag, value, className) => {
        const element = document.createElement(tag);
        if (value !== undefined) element.textContent = value;
        if (className) element.className = className;
        return element;
    };
    const openRecord = (record) => {
        const box = window.FixMyLGA.dialog({title: record.title, copy: `${record.lga} LGA · ${record.state} · ${record.category}. Public issue status: Unresolved.`});
        if (record.image) {
            const image = node("img", undefined, "record-dialog-image");
            image.src = `assets/${record.image}`;
            image.alt = record.title;
            box.insertBefore(image, box.querySelector(".action-feedback"));
        }
        const verify = node("button", "Verify this issue", "button");
        verify.type = "button";
        verify.dataset.verifyIssue = record.id;
        verify.dataset.issueTitle = record.title;
        box.querySelector(".dialog-actions").prepend(verify);
        window.FixMyLGA.renderActions();
    };
    // Complete the public cards on the home and related-issue pages.
    document.querySelectorAll("article.issue-card").forEach((card) => {
        const source = card.querySelector("img")?.getAttribute("src");
        const record = records.find((item) => source === `assets/${item.image}`);
        if (!record) return;
        const button = node("button", "View issue →", "text-button card-open-button");
        button.type = "button";
        button.setAttribute("aria-label", `View issue: ${record.title}`);
        button.addEventListener("click", () => openRecord(record));
        card.append(button);
    });
    const stateSelect = document.querySelector("[data-demo-state]");
    const initialResults = document.querySelector("[data-initial-results]");
    const lgaResults = document.querySelector("[data-lga-results]");
    const stateData = window.FIXMYLGA_STATE_LGAS;
    if (stateSelect && initialResults && lgaResults && stateData) {
        const categorySelect = document.getElementById("category-filter");
        const statusSelect = document.getElementById("status-filter");
        const requestedState = new URLSearchParams(location.search).get("state");
        if (Object.hasOwn(stateData, requestedState)) stateSelect.value = requestedState;
        const render = () => {
            const stateName = stateSelect.value;
            const selectedState = Object.hasOwn(stateData, stateName) ? stateName : "";
            const matches = records.filter((record) => (!selectedState || record.state === selectedState) && (!categorySelect.value || record.category === categorySelect.value) && (!statusSelect.value || statusSelect.value === "Unresolved"));
            initialResults.replaceChildren();
            document.querySelector("[data-result-count]").textContent = `${matches.length} public issue${matches.length === 1 ? "" : "s"}${selectedState ? ` in ${selectedState}` : " across Nigeria"}`;
            if (!matches.length) {
                const empty = node("div", undefined, "empty-state issue-browse-empty-state");
                empty.append(node("h3", "No issues match these filters"), node("p", "Choose another category or status, or document an issue in your area."));
                const action = node("a", "Report an issue →", "text-link");
                action.href = `report.html${selectedState ? `?state=${encodeURIComponent(selectedState)}` : ""}`;
                empty.append(action);
                initialResults.append(empty);
            } else {
                const grid = node("div", undefined, "issue-grid issue-grid-page");
                matches.forEach((record) => {
                    const card = node(record.href ? "a" : "article", undefined, "issue-card" + (record.href ? " issue-card-link" : ""));
                    if (record.href) card.href = record.href;
                    const top = node("div", undefined, "issue-card-top");
                    top.append(node("span", record.category, "category-badge"));
                    card.append(top);
                    if (record.image) {
                        const frame = node("div", undefined, "recent-issue-image");
                        const image = node("img"); image.src = `assets/${record.image}`; image.alt = record.title; image.loading = "lazy";
                        frame.append(image); card.append(frame);
                    }
                    card.append(node("h3", record.title), node("p", `${record.lga} LGA · ${record.state}`, "location"));
                    const footer = node("div", undefined, "issue-card-footer");
                    footer.append(node("span", "Unresolved", "status"), node("span", "0 / 20"));
                    card.append(footer);
                    const action = node(record.href ? "span" : "button", "View issue →", "text-button card-open-button");
                    if (!record.href) { action.type = "button"; action.setAttribute("aria-label", `View issue: ${record.title}`); action.addEventListener("click", () => openRecord(record)); }
                    card.append(action); grid.append(card);
                });
                initialResults.append(grid);
            }
            lgaResults.replaceChildren();
            lgaResults.hidden = !selectedState;
            if (selectedState) {
                const section = node("section", undefined, "state-lga-section");
                const heading = node("div", undefined, "section-heading section-heading-compact");
                heading.append(node("span", selectedState, "section-label"), node("h2", `${stateData[selectedState].length} Local Government Areas`));
                const grid = node("div", undefined, "lga-grid state-lga-grid");
                stateData[selectedState].forEach((lgaName) => {
                    const card = node("article", undefined, "lga-card lga-card-static");
                    const count = records.filter((record) => record.state === selectedState && record.lga === lgaName).length;
                    card.append(node("span", selectedState), node("h3", lgaName), node("strong", `${count} public issue${count === 1 ? "" : "s"}`));
                    const actions = node("div", undefined, "lga-card-actions");
                    const action = node("a", lgaName === "Eti-Osa" && selectedState === "Lagos" ? "Open LGA →" : "Report here →", "text-link");
                    action.href = lgaName === "Eti-Osa" && selectedState === "Lagos" ? "lga-eti-osa.html" : `report.html?state=${encodeURIComponent(selectedState)}&lga=${encodeURIComponent(lgaName)}`;
                    const follow = node("button", "Follow this LGA", "text-button");
                    follow.type = "button";
                    follow.dataset.followLga = lgaName; follow.dataset.followState = selectedState;
                    actions.append(action, follow); card.append(actions); grid.append(card);
                });
                section.append(heading, grid); lgaResults.append(section);
                window.FixMyLGA.renderActions();
            }
        };
        [stateSelect, categorySelect, statusSelect].forEach((select) => select.addEventListener("change", render));
        render();
    }
    document.querySelectorAll("[data-current-year]").forEach((element) => { element.textContent = String(new Date().getFullYear()); });
})();
