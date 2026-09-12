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
    const portfolioNotice = document.querySelector(".portfolio-notice");
    if (portfolioNotice) {
        const noticeCopy = portfolioNotice.querySelector("p");
        const noticeLink = portfolioNotice.querySelector("a");
        if (noticeCopy) {
            noticeCopy.replaceChildren();
            const noticeTitle = document.createElement("strong");
            noticeTitle.textContent = "Interactive portfolio demo";
            noticeCopy.append(noticeTitle, " — explore the product safely. Nothing is submitted or stored.");
        }
        if (noticeLink) {
            noticeLink.href = "report.html";
            noticeLink.textContent = "Try reporting an issue →";
        }
    }
    document.querySelectorAll(".portfolio-attribution").forEach((element) => {
        element.textContent = "An interactive portfolio by Emmanuel Oberabor";
    });
    document.querySelectorAll(".legal-meta").forEach((element) => {
        element.textContent = element.textContent.replace("Read-only portfolio edition", "Interactive portfolio edition");
    });
    document.querySelectorAll(".legal-page h2").forEach((heading) => {
        if (heading.textContent.trim() === "What this version collects") {
            heading.nextElementSibling.textContent = "The report walkthrough never sends a form or makes an application API call. Selected files are previewed only in this browser tab. The portfolio does not use cookies or persistent browser storage.";
        }
        if (heading.textContent.trim() === "Read-only demonstration") {
            heading.textContent = "Interactive demonstration";
            heading.nextElementSibling.textContent = "The portfolio demonstrates the reporting workflow but does not accept, publish or save reports, accounts or evidence.";
        }
        if (heading.textContent.trim() === "Portfolio status") {
            heading.nextElementSibling.textContent = "Visitors can try the local reporting walkthrough. Live posting, accounts, verification and moderation queues remain paused.";
        }
    });
    const lgaActions = document.querySelector(".lga-map-hero-section .page-actions");
    if (lgaActions && !lgaActions.querySelector("a[href='report.html']")) {
        const reportLink = document.createElement("a");
        reportLink.href = "report.html";
        reportLink.className = "button";
        reportLink.textContent = "Report an Issue";
        lgaActions.prepend(reportLink);
    }
    const stateSelect = document.querySelector("[data-demo-state]");
    const initialResults = document.querySelector("[data-initial-results]");
    const lgaResults = document.querySelector("[data-lga-results]");
    const stateData = window.FIXMYLGA_STATE_LGAS;
    if (stateSelect && initialResults && lgaResults && stateData) {
        const preservedCounts = {
            "Federal Capital Territory": {"Abuja Municipal": 4},
            "Lagos": {"Alimosho": 1, "Eti-Osa": 1, "Shomolu": 1}
        };

        const renderLgaResults = (stateName) => {
            const lgas = stateData[stateName];
            initialResults.hidden = Boolean(lgas);
            lgaResults.hidden = !lgas;
            lgaResults.replaceChildren();
            if (!lgas) return;

            const section = document.createElement("section");
            section.className = "state-lga-section";
            const heading = document.createElement("div");
            heading.className = "section-heading section-heading-compact";
            const label = document.createElement("span");
            label.className = "section-label";
            label.textContent = stateName;
            const title = document.createElement("h2");
            title.textContent = `${lgas.length} Local Government Area${lgas.length === 1 ? "" : "s"}`;
            const help = document.createElement("p");
            help.className = "lga-results-help";
            help.textContent = "Issue counts reflect only the public records preserved in this portfolio demonstration.";
            heading.append(label, title, help);

            const grid = document.createElement("div");
            grid.className = "lga-grid state-lga-grid";
            lgas.forEach((lgaName) => {
                const count = preservedCounts[stateName]?.[lgaName] || 0;
                let card;
                if (stateName === "Lagos" && lgaName === "Eti-Osa") {
                    card = document.createElement("a");
                    card.href = "lga-eti-osa.html";
                    card.className = "lga-card lga-card-active";
                    card.setAttribute("aria-label", "Open Eti-Osa LGA with 1 preserved issue");
                } else if (stateName === "Federal Capital Territory" && lgaName === "Abuja Municipal") {
                    card = document.createElement("a");
                    card.href = "issue-jabi.html";
                    card.className = "lga-card lga-card-active";
                    card.setAttribute("aria-label", "Open a preserved Abuja Municipal issue record");
                } else if (stateName === "Lagos" && ["Alimosho", "Shomolu"].includes(lgaName)) {
                    card = document.createElement("a");
                    card.href = lgaName === "Alimosho" ? "issue-oluwaga-bus-stop.html" : "issue-isaac-john-waste.html";
                    card.className = "lga-card lga-card-active";
                } else {
                    card = document.createElement("article");
                    card.className = "lga-card lga-card-static";
                }
                const state = document.createElement("span");
                state.textContent = stateName;
                const name = document.createElement("h3");
                name.textContent = lgaName;
                const total = document.createElement("strong");
                total.textContent = `${count} issue${count === 1 ? "" : "s"}`;
                card.append(state, name, total);
                if (card.tagName === "A") {
                    const action = document.createElement("small");
                    action.className = "lga-card-action";
                    action.textContent = stateName === "Lagos" ? "Open LGA →" : "Open preserved issue →";
                    card.append(action);
                }
                grid.append(card);
            });
            section.append(heading, grid);
            lgaResults.append(section);
        };

        stateSelect.addEventListener("change", () => renderLgaResults(stateSelect.value));
    }
    document.querySelectorAll("[data-current-year]").forEach((element) => {
        element.textContent = String(new Date().getFullYear());
    });
})();
