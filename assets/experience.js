(() => {
    "use strict";
    const KEY = "fixmylga.experience.v1";
    const ISSUE_IDS = new Set(["jabi", "eti-osa-flood", "oluwaga", "gaduwa", "isaac-john", "garki", "gogon-gada"]);
    const CATEGORIES = new Set(["Flooding & Drainage", "Public Infrastructure", "Roads", "Waste & Sanitation", "Other"]);
    const text = (value, max = 300) => typeof value === "string" ? value.trim().slice(0, max) : "";
    const validDate = (value) => typeof value === "string" && Number.isFinite(Date.parse(value));
    const date = () => new Date().toISOString();
    const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const empty = () => ({version: 1, profile: {name: "Community member", state: "", lga: ""}, reports: [], verifications: [], fixes: [], comments: [], follows: [], activity: []});
    const validate = (data) => {
        const clean = empty();
        if (!data || data.version !== 1) return clean;
        clean.profile = {name: text(data.profile?.name, 80) || "Community member", state: text(data.profile?.state, 50), lga: text(data.profile?.lga, 80)};
        const array = (key, max) => Array.isArray(data[key]) ? data[key].slice(0, max).filter((item) => item && typeof item === "object" && !Array.isArray(item)) : [];
        clean.reports = array("reports", 50).filter((item) => text(item.id, 80) && text(item.title, 200) && CATEGORIES.has(item.category) && validDate(item.date)).map((item) => ({id: text(item.id, 80), title: text(item.title, 200), description: text(item.description), state: text(item.state, 50), lga: text(item.lga, 80), category: item.category, date: item.date, status: "Saved in this tab"}));
        ["verifications", "fixes"].forEach((key) => {
            const seen = new Set();
            clean[key] = array(key, 7).filter((item) => ISSUE_IDS.has(item.issue) && validDate(item.date) && !seen.has(item.issue) && seen.add(item.issue)).map((item) => ({issue: item.issue, title: text(item.title, 200), note: text(item.note), date: item.date}));
        });
        clean.comments = array("comments", 100).filter((item) => ISSUE_IDS.has(item.issue) && text(item.body, 600) && validDate(item.date)).map((item) => ({id: text(item.id, 80), issue: item.issue, name: text(item.name, 80) || "Community member", body: text(item.body, 600), date: item.date}));
        const seenFollows = new Set();
        clean.follows = array("follows", 100).filter((item) => text(item.state, 50) && text(item.lga, 80) && !seenFollows.has(`${item.state}/${item.lga}`) && seenFollows.add(`${item.state}/${item.lga}`)).map((item) => ({state: text(item.state, 50), lga: text(item.lga, 80)}));
        clean.activity = array("activity", 100).filter((item) => text(item.label, 240) && validDate(item.date)).map((item) => ({label: text(item.label, 240), date: item.date, href: ["issue-jabi.html", "lga-eti-osa.html", "profile.html#my-reports", "profile.html#following"].includes(item.href) ? item.href : "profile.html"}));
        return clean;
    };
    let state = empty();
    let storageAvailable = true;
    try {
        const raw = sessionStorage.getItem(KEY);
        state = raw && raw.length < 150000 ? validate(JSON.parse(raw)) : empty();
    } catch { storageAvailable = false; }
    const node = (tag, value, className) => {
        const element = document.createElement(tag);
        if (value !== undefined) element.textContent = value;
        if (className) element.className = className;
        return element;
    };
    const link = (label, href, className) => {
        const element = node("a", label, className);
        element.href = href;
        return element;
    };
    const addActivity = (label, href = "profile.html") => state.activity.unshift({label, href, date: date()});
    const commit = () => {
        state = validate(state);
        try { sessionStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; }
        catch { storageAvailable = false; }
        window.dispatchEvent(new Event("fixmylga:change"));
    };
    const shortDate = (value) => new Date(value).toLocaleDateString("en-NG", {day: "numeric", month: "short"});
    const localNote = () => storageAvailable ? "Saved only in this browser tab." : "Browser storage is unavailable. This change lasts only while this page stays open.";
    let activeDialog;
    const dialog = ({title, copy, label, field, confirm}) => {
        activeDialog?.close();
        const previousFocus = document.activeElement;
        const box = node("dialog", undefined, "experience-dialog");
        box.setAttribute("aria-labelledby", "experience-dialog-title");
        box.setAttribute("aria-describedby", "experience-dialog-copy");
        const heading = node("h2", title);
        heading.id = "experience-dialog-title";
        const description = node("p", copy);
        description.id = "experience-dialog-copy";
        box.append(heading, description);
        let input;
        if (field) {
            const fieldLabel = node("label", field.label, "experience-field");
            input = node(field.multiline ? "textarea" : "input");
            input.id = "experience-dialog-field";
            if (!field.multiline) input.type = "text";
            input.maxLength = field.max || 300;
            input.required = Boolean(field.required);
            input.value = field.value || "";
            input.readOnly = Boolean(field.readOnly);
            if (field.multiline) input.rows = 4;
            fieldLabel.htmlFor = input.id;
            box.append(fieldLabel, input);
        }
        const status = node("p", "", "action-feedback");
        status.setAttribute("role", "status");
        const actions = node("div", undefined, "dialog-actions");
        const close = node("button", "Cancel", "button button-secondary");
        close.type = "button";
        close.addEventListener("click", () => box.close());
        if (label) {
            const accept = node("button", label, "button");
            accept.type = "button";
            accept.addEventListener("click", async () => {
                if (input?.required && !input.value.trim()) { input.setCustomValidity("Please add a short note."); input.reportValidity(); return; }
                input?.setCustomValidity("");
                accept.disabled = true;
                try {
                    const message = await confirm(input?.value || "");
                    status.textContent = message || localNote();
                    close.textContent = "Done";
                    if (!field?.readOnly) {
                        accept.hidden = true;
                        if (input) input.readOnly = true;
                        const profileLink = link("View My Profile", "profile.html", "button");
                        actions.append(profileLink);
                        close.focus();
                    } else {
                        accept.disabled = false;
                        input.focus(); input.select();
                    }
                } catch (error) {
                    status.textContent = error.message || "Please try again.";
                    accept.disabled = false;
                }
            });
            actions.append(accept);
        } else close.textContent = "Close";
        actions.append(close);
        box.append(status, actions);
        document.body.append(box);
        activeDialog = box;
        box.addEventListener("click", (event) => { if (event.target === box) { const rect = box.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) box.close(); } });
        box.addEventListener("close", () => { box.remove(); if (activeDialog === box) activeDialog = null; if (previousFocus?.isConnected) previousFocus.focus(); });
        box.showModal();
        if (field && !field.readOnly) input.focus(); else close.focus();
        return box;
    };
    const issueHref = (issue) => issue === "eti-osa-flood" ? "lga-eti-osa.html" : "issue-jabi.html";
    const verify = (issue, title) => {
        if (!ISSUE_IDS.has(issue)) return;
        if (state.verifications.some((item) => item.issue === issue)) {
            dialog({title: "Your confirmation is recorded", copy: `You already confirmed this issue in this tab. The public verification count is unchanged. ${localNote()}`});
            return;
        }
        dialog({title: "Verify this issue", copy: "On the live service, your location and current evidence would help confirm that this issue is still present. Here, your confirmation is added to your profile in this browser only; it does not change the public verification count.", label: "Confirm this issue", confirm: () => {
            if (!state.verifications.some((item) => item.issue === issue)) {
                state.verifications.unshift({issue, title, date: date(), note: ""});
                addActivity(`Confirmed: ${title}`, issueHref(issue));
                commit();
            }
            return `Confirmation added to your profile. ${localNote()}`;
        }});
    };
    const fix = (issue, title) => {
        if (!ISSUE_IDS.has(issue)) return;
        if (state.fixes.some((item) => item.issue === issue)) {
            dialog({title: "Your fix update is recorded", copy: `Your update is already in your profile. The public issue remains unresolved until evidence is reviewed by the live service. ${localNote()}`});
            return;
        }
        dialog({title: "Report a fix", copy: "Describe what has improved. On the live service, resolution evidence would go through moderation before an issue is marked resolved. This update is added only to your browser profile and does not resolve the public issue.", field: {label: "What has changed?", multiline: true, required: true}, label: "Save fix update", confirm: (note) => {
            if (!state.fixes.some((item) => item.issue === issue)) {
                state.fixes.unshift({issue, title, note: text(note), date: date()});
                addActivity(`Added a fix update: ${title}`, issueHref(issue));
                commit();
            }
            return `Fix update added to your profile. ${localNote()}`;
        }});
    };
    const follow = (lga, stateName) => {
        const index = state.follows.findIndex((item) => item.lga === lga && item.state === stateName);
        if (index >= 0) { state.follows.splice(index, 1); addActivity(`Unfollowed ${lga} LGA`, "profile.html#following"); }
        else {
            if (state.follows.length >= 100) return false;
            state.follows.unshift({lga, state: stateName});
            addActivity(`Following ${lga} LGA`, "profile.html#following");
        }
        commit();
        return index < 0;
    };
    const renderActions = () => {
        document.querySelectorAll("[data-verify-issue]").forEach((button) => {
            const done = state.verifications.some((item) => item.issue === button.dataset.verifyIssue);
            button.textContent = done ? "Confirmed by you" : "Verify this issue";
            button.setAttribute("aria-pressed", String(done));
        });
        document.querySelectorAll("[data-fix-issue]").forEach((button) => {
            const done = state.fixes.some((item) => item.issue === button.dataset.fixIssue);
            button.textContent = done ? "Fix update saved" : "Report a fix";
            button.setAttribute("aria-pressed", String(done));
        });
        document.querySelectorAll("[data-follow-lga]").forEach((button) => {
            const following = state.follows.some((item) => item.lga === button.dataset.followLga && item.state === button.dataset.followState);
            button.textContent = following ? "Following · Unfollow" : "Follow this LGA";
            button.setAttribute("aria-pressed", String(following));
        });
    };
    const emptyRow = (container, message, label, href) => {
        const block = node("div", undefined, "profile-empty-state");
        block.append(node("p", message), link(label, href, "text-link"));
        container.append(block);
    };
    const profile = document.querySelector("[data-profile-dashboard]");
    const renderProfile = () => {
        if (!profile) return;
        document.querySelector("[data-profile-name]").textContent = state.profile.name;
        document.querySelector("[data-profile-home]").textContent = state.profile.lga ? `${state.profile.lga} LGA · ${state.profile.state}` : "Your community. Your contributions.";
        document.querySelector("[data-profile-initials]").textContent = state.profile.name.split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase();
        ["reports", "verifications", "fixes", "follows"].forEach((key) => { document.querySelector(`[data-count="${key}"]`).textContent = String(state[key].length); });
        const reports = document.querySelector("[data-profile-reports]");
        reports.replaceChildren();
        state.reports.forEach((report) => {
            const row = node("article", undefined, "profile-row profile-report-row");
            row.append(node("h3", report.title), node("small", `${report.lga} · ${report.state} · ${shortDate(report.date)}`), node("p", report.description), node("span", report.status, "local-status"));
            reports.append(row);
        });
        if (!state.reports.length) emptyRow(reports, "A clearer picture starts with your first report.", "Report an issue →", "report.html");
        const contributions = document.querySelector("[data-profile-contributions]");
        contributions.replaceChildren();
        [...state.verifications.map((item) => ({...item, label: "Issue confirmation"})), ...state.fixes.map((item) => ({...item, label: "Fix update"}))].sort((a, b) => b.date.localeCompare(a.date)).forEach((item) => {
            const row = node("article", undefined, "profile-row");
            row.append(link(item.title, issueHref(item.issue)), node("small", `${item.label} · ${shortDate(item.date)} · In this tab`));
            if (item.note) row.append(node("p", item.note));
            contributions.append(row);
        });
        if (!contributions.children.length) emptyRow(contributions, "Help document what is happening and what has changed.", "View an issue →", "issue-jabi.html");
        const following = document.querySelector("[data-profile-following]");
        following.replaceChildren();
        state.follows.forEach((item) => {
            const row = node("div", undefined, "profile-row following-row");
            const detail = node("div");
            const href = item.lga === "Eti-Osa" && item.state === "Lagos" ? "lga-eti-osa.html" : `issues.html?state=${encodeURIComponent(item.state)}`;
            detail.append(link(`${item.lga} LGA`, href), node("small", item.state));
            const button = node("button", "Unfollow", "text-button");
            button.type = "button";
            button.setAttribute("aria-label", `Unfollow ${item.lga} LGA`);
            button.addEventListener("click", () => { follow(item.lga, item.state); document.getElementById("following").focus(); });
            row.append(detail, button);
            following.append(row);
        });
        if (!state.follows.length) emptyRow(following, "Keep the places you care about close by.", "Explore Eti-Osa →", "lga-eti-osa.html");
        const activity = document.querySelector("[data-profile-activity]");
        activity.replaceChildren();
        state.activity.forEach((item) => {
            const row = link("", item.href, "profile-row");
            row.append(node("span", item.label), node("small", shortDate(item.date)));
            activity.append(row);
        });
        if (!state.activity.length) emptyRow(activity, "Your reports, confirmations and followed LGAs will appear here.", "Explore your community →", "issues.html");
        document.querySelector("[data-profile-storage]").textContent = storageAvailable ? "Your profile and contributions stay in this tab. No account is created. Reset below to clear them." : localNote();
    };
    const renderComments = () => {
        const list = document.querySelector("[data-comments]");
        if (!list) return;
        list.replaceChildren();
        const items = state.comments.filter((comment) => comment.issue === "jabi");
        if (!items.length) { list.append(node("p", "No comments yet. Add your perspective.", "muted-copy")); return; }
        items.forEach((comment) => {
            const article = node("article", undefined, "local-comment");
            const header = node("div", undefined, "comment-meta");
            header.append(node("strong", comment.name), node("small", `${shortDate(comment.date)} · In this tab`));
            article.append(header, node("p", comment.body));
            list.append(article);
        });
    };
    document.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        if (button.dataset.verifyIssue) verify(button.dataset.verifyIssue, button.dataset.issueTitle);
        if (button.dataset.fixIssue) fix(button.dataset.fixIssue, button.dataset.issueTitle);
        if (button.dataset.followLga) {
            const result = follow(button.dataset.followLga, button.dataset.followState);
            const feedback = document.querySelector("[data-follow-feedback]");
            if (feedback) feedback.textContent = `${result ? "LGA added to your profile." : "LGA removed from your following list."} ${localNote()}`;
        }
        if (button.hasAttribute("data-share-issue")) {
            const url = new URL("issue-jabi.html", location.href).href;
            dialog({title: "Share this issue", copy: "Copy the public issue link to share it with someone. Your profile and local contributions are not included.", field: {label: "Issue link", value: url, readOnly: true, max: 2048}, label: "Copy link", confirm: async () => {
                try { await navigator.clipboard.writeText(url); return "Link copied."; }
                catch { return "Select the link and use your browser’s Copy command."; }
            }});
        }
    });
    const commentForm = document.getElementById("comment-form");
    commentForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = document.getElementById("comment-body");
        const body = text(input.value, 600);
        const feedback = document.querySelector("[data-comment-feedback]");
        if (!body) { input.setCustomValidity("Write a comment first."); input.reportValidity(); return; }
        input.setCustomValidity("");
        if (state.comments.length >= 100) { feedback.textContent = "This tab has reached its comment limit. Reset your profile to start fresh."; return; }
        state.comments.unshift({id: id(), issue: "jabi", name: state.profile.name, body, date: date()});
        addActivity("Commented on the Jabi drainage issue", "issue-jabi.html");
        commit();
        input.value = "";
        feedback.textContent = `Comment added in this tab. It has not been published to the community. ${localNote()}`;
    });
    document.getElementById("comment-body")?.addEventListener("input", (event) => event.target.setCustomValidity(""));
    if (profile) {
        const form = document.getElementById("profile-form");
        const name = document.getElementById("profile-name");
        const stateSelect = document.getElementById("profile-state");
        const lgaSelect = document.getElementById("profile-lga");
        const stateData = window.FIXMYLGA_STATE_LGAS || {};
        Object.keys(stateData).forEach((stateName) => { const option = node("option", stateName); option.value = stateName; stateSelect.append(option); });
        const setLgas = (selected = "") => {
            lgaSelect.replaceChildren();
            const blank = node("option", stateSelect.value ? "Choose your LGA" : "Choose a state first"); blank.value = ""; lgaSelect.append(blank);
            (stateData[stateSelect.value] || []).forEach((lga) => { const option = node("option", lga); option.value = lga; lgaSelect.append(option); });
            lgaSelect.disabled = !stateSelect.value;
            lgaSelect.value = (stateData[stateSelect.value] || []).includes(selected) ? selected : "";
        };
        const restoreFields = () => { name.value = state.profile.name; stateSelect.value = stateData[state.profile.state] ? state.profile.state : ""; setLgas(state.profile.lga); };
        stateSelect.addEventListener("change", () => setLgas());
        restoreFields();
        name.addEventListener("input", () => name.setCustomValidity(""));
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            if (!text(name.value, 80)) { name.setCustomValidity("Enter a display name."); name.reportValidity(); return; }
            const feedback = document.querySelector("[data-profile-feedback]");
            if (stateSelect.value && !lgaSelect.value) { feedback.textContent = "Choose your home LGA, or leave the state blank."; lgaSelect.focus(); return; }
            state.profile = {name: text(name.value, 80), state: stateSelect.value, lga: lgaSelect.value};
            commit();
            feedback.textContent = `Profile updated. ${localNote()}`;
        });
        document.getElementById("reset-profile").addEventListener("click", () => {
            const box = dialog({title: "Reset your profile?", copy: "This clears your display name, reports, comments, confirmations, fix updates and followed LGAs from this tab.", label: "Reset profile", confirm: () => {
                state = empty();
                commit();
                restoreFields();
                document.querySelector("[data-profile-feedback]").textContent = "";
                return "Your profile has been reset. You can start again.";
            }});
            box.classList.add("reset-dialog");
        });
    }
    window.FixMyLGA = Object.freeze({
        getState: () => JSON.parse(JSON.stringify(state)),
        dialog, verify, fix, renderActions, localNote,
        saveReport: (report) => {
            const existing = state.reports.find((item) => item.id === report.id);
            if (existing) return existing.id;
            if (state.reports.length >= 50) throw new Error("This tab has reached its report limit. Reset your profile to start fresh.");
            if (!text(report.title, 200) || !text(report.description) || !CATEGORIES.has(report.category) || !(window.FIXMYLGA_STATE_LGAS?.[report.state] || []).includes(report.lga)) throw new Error("Please review the report details and location.");
            const reportId = text(report.id, 80) || id();
            state.reports.unshift({id: reportId, title: text(report.title, 200), description: text(report.description), state: text(report.state, 50), lga: text(report.lga, 80), category: report.category, date: date(), status: "Saved in this tab"});
            addActivity(`Added a report: ${report.title}`, "profile.html#my-reports");
            commit();
            return reportId;
        }
    });
    window.addEventListener("fixmylga:change", () => { renderActions(); renderProfile(); renderComments(); });
    renderActions(); renderProfile(); renderComments();
})();
