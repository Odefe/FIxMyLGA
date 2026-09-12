(() => {
    "use strict";

    const form = document.getElementById("report-form");
    const stateData = window.FIXMYLGA_STATE_LGAS;
    if (!form || !stateData) return;

    const stateSelect = document.getElementById("report-state");
    const lgaSelect = document.getElementById("report-lga");
    const titleInput = document.getElementById("report-title");
    const descriptionInput = document.getElementById("report-description");
    const titleCount = document.getElementById("title-count");
    const descriptionCount = document.getElementById("description-count");
    const errorSummary = document.getElementById("report-errors");
    const reviewPanel = document.getElementById("report-review");
    const completePanel = document.getElementById("report-complete");
    const categoryButtons = Array.from(document.querySelectorAll("[data-category]"));
    const evidenceSlots = Array.from(document.querySelectorAll("[data-evidence-slot]"));
    let selectedCategory = "";
    const evidence = {photo1: null, photo2: null, video: null};

    Object.keys(stateData).forEach((stateName) => {
        const option = document.createElement("option");
        option.value = stateName;
        option.textContent = stateName;
        stateSelect.append(option);
    });

    const populateLgas = (selected = "") => {
        lgaSelect.replaceChildren();
        const stateName = stateSelect.value;
        const first = document.createElement("option");
        first.value = "";
        first.textContent = stateName ? "Select an LGA" : "Select a state first";
        lgaSelect.append(first);
        lgaSelect.disabled = !stateName;
        (stateData[stateName] || []).forEach((lgaName) => {
            const option = document.createElement("option");
            option.value = lgaName;
            option.textContent = lgaName;
            lgaSelect.append(option);
        });
        if (selected && stateData[stateName]?.includes(selected)) lgaSelect.value = selected;
    };

    stateSelect.addEventListener("change", () => {
        populateLgas();
        stateSelect.removeAttribute("aria-invalid");
    });
    lgaSelect.addEventListener("change", () => lgaSelect.removeAttribute("aria-invalid"));

    const setCategory = (name) => {
        selectedCategory = name;
        categoryButtons.forEach((button) => {
            const selected = button.dataset.category === name;
            button.classList.toggle("is-selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
    };
    categoryButtons.forEach((button) => button.addEventListener("click", () => setCategory(button.dataset.category)));

    const revokeEvidenceUrl = (item) => {
        if (item?.objectUrl) URL.revokeObjectURL(item.source);
    };

    const renderEvidenceSlot = (key) => {
        const slot = document.querySelector(`[data-evidence-slot="${key}"]`);
        const preview = slot.querySelector("[data-evidence-preview]");
        const name = slot.querySelector("[data-evidence-name]");
        const remove = slot.querySelector("[data-remove-evidence]");
        const item = evidence[key];
        preview.replaceChildren();
        if (!item) {
            const placeholder = document.createElement("span");
            placeholder.textContent = key === "video" ? "Video preview" : `${key === "photo1" ? "Photo 1" : "Photo 2"} preview`;
            preview.append(placeholder);
            name.textContent = "No file selected";
            remove.hidden = true;
            slot.classList.remove("has-evidence");
            return;
        }
        const media = document.createElement(key === "video" ? "video" : "img");
        media.src = item.source;
        if (key === "video") {
            media.controls = true;
            media.muted = true;
            media.playsInline = true;
            media.preload = "metadata";
            media.setAttribute("aria-label", item.name);
        } else {
            media.alt = item.name;
        }
        preview.append(media);
        name.textContent = item.name;
        remove.hidden = false;
        slot.classList.add("has-evidence");
    };

    const setEvidence = (key, item) => {
        revokeEvidenceUrl(evidence[key]);
        evidence[key] = item;
        renderEvidenceSlot(key);
    };

    evidenceSlots.forEach((slot) => {
        const key = slot.dataset.evidenceSlot;
        const input = slot.querySelector("input[type='file']");
        const choose = slot.querySelector(".evidence-choose");
        const remove = slot.querySelector("[data-remove-evidence]");
        choose.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                input.click();
            }
        });
        input.addEventListener("change", () => {
            const file = input.files[0];
            if (!file) return;
            const valid = key === "video" ? file.type.startsWith("video/") : file.type.startsWith("image/");
            if (!valid) {
                input.value = "";
                errorSummary.replaceChildren();
                const message = document.createElement("strong");
                message.textContent = key === "video" ? "Please choose a video file." : "Please choose an image file.";
                errorSummary.append(message);
                errorSummary.hidden = false;
                errorSummary.focus();
                return;
            }
            setEvidence(key, {source: URL.createObjectURL(file), name: file.name, objectUrl: true});
            errorSummary.hidden = true;
        });
        remove.addEventListener("click", () => {
            input.value = "";
            setEvidence(key, null);
            choose.focus();
        });
    });

    const updateCounts = () => {
        titleCount.textContent = `${titleInput.value.length} / 200`;
        descriptionCount.textContent = `${descriptionInput.value.length} / 300`;
    };
    titleInput.addEventListener("input", () => { titleInput.removeAttribute("aria-invalid"); updateCounts(); });
    descriptionInput.addEventListener("input", () => { descriptionInput.removeAttribute("aria-invalid"); updateCounts(); });

    const loadSample = () => {
        setCategory("Flooding & Drainage");
        stateSelect.value = "Federal Capital Territory";
        populateLgas("Abuja Municipal");
        titleInput.value = "Blocked drainage causing waterlogging beside Jabi Lake Mall";
        descriptionInput.value = "Rainwater is collecting across the access road because the roadside drain is blocked. Vehicles are slowing and pedestrians have to step into traffic.";
        setEvidence("photo1", {source: "assets/jabi-drainage-1.jpg", name: "Sample photo 1 · preserved public evidence", objectUrl: false});
        setEvidence("photo2", {source: "assets/jabi-drainage-2.jpg", name: "Sample photo 2 · preserved public evidence", objectUrl: false});
        setEvidence("video", {source: "assets/fixmylga-portfolio-walkthrough.webm", name: "Sample demonstration video", objectUrl: false});
        updateCounts();
        errorSummary.hidden = true;
        reviewPanel.hidden = true;
        completePanel.hidden = true;
        titleInput.focus();
    };
    document.getElementById("load-demo-report").addEventListener("click", loadSample);

    const renderErrors = (errors) => {
        errorSummary.replaceChildren();
        const heading = document.createElement("strong");
        heading.textContent = "Please review your report";
        const list = document.createElement("ul");
        errors.forEach(({message}) => {
            const item = document.createElement("li");
            item.textContent = message;
            list.append(item);
        });
        errorSummary.append(heading, list);
        errorSummary.hidden = false;
        errorSummary.focus();
        errors[0]?.target?.focus();
    };

    const buildReview = () => {
        document.querySelector("[data-review-category]").textContent = selectedCategory;
        document.querySelector("[data-review-location]").textContent = `${lgaSelect.value} LGA · ${stateSelect.value}`;
        document.querySelector("[data-review-title]").textContent = titleInput.value.trim();
        document.querySelector("[data-review-description]").textContent = descriptionInput.value.trim();
        document.querySelector("[data-review-evidence]").textContent = "2 photos and 1 video ready for moderation";
        const previews = document.querySelector("[data-review-previews]");
        previews.replaceChildren();
        Object.entries(evidence).forEach(([key, item]) => {
            const media = document.createElement(key === "video" ? "video" : "img");
            media.src = item.source;
            if (key === "video") {
                media.muted = true;
                media.playsInline = true;
                media.preload = "metadata";
                media.setAttribute("aria-label", item.name);
            } else {
                media.alt = item.name;
            }
            previews.append(media);
        });
        reviewPanel.hidden = false;
        completePanel.hidden = true;
        reviewPanel.scrollIntoView({behavior: "smooth", block: "start"});
    };

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const errors = [];
        if (!selectedCategory) errors.push({message: "Choose an issue category.", target: categoryButtons[0]});
        if (!stateSelect.value) { stateSelect.setAttribute("aria-invalid", "true"); errors.push({message: "Select a state or the FCT.", target: stateSelect}); }
        if (!lgaSelect.value) { lgaSelect.setAttribute("aria-invalid", "true"); errors.push({message: "Select a Local Government Area.", target: lgaSelect}); }
        if (!evidence.photo1) errors.push({message: "Add the first photo.", target: document.querySelector("[data-evidence-slot='photo1'] .evidence-choose")});
        if (!evidence.photo2) errors.push({message: "Add the second photo.", target: document.querySelector("[data-evidence-slot='photo2'] .evidence-choose")});
        if (!evidence.video) errors.push({message: "Add a video.", target: document.querySelector("[data-evidence-slot='video'] .evidence-choose")});
        if (!titleInput.value.trim()) { titleInput.setAttribute("aria-invalid", "true"); errors.push({message: "Add a clear report title.", target: titleInput}); }
        if (!descriptionInput.value.trim()) { descriptionInput.setAttribute("aria-invalid", "true"); errors.push({message: "Describe the physical issue.", target: descriptionInput}); }
        if (errors.length) { renderErrors(errors); return; }
        errorSummary.hidden = true;
        buildReview();
    });

    const clearReport = (focus = true) => {
        Object.keys(evidence).forEach((key) => setEvidence(key, null));
        form.reset();
        setCategory("");
        populateLgas();
        updateCounts();
        errorSummary.hidden = true;
        reviewPanel.hidden = true;
        completePanel.hidden = true;
        if (focus) categoryButtons[0].focus();
    };
    document.getElementById("clear-report").addEventListener("click", () => clearReport());
    document.getElementById("edit-report").addEventListener("click", () => {
        reviewPanel.hidden = true;
        document.getElementById("category-step").scrollIntoView({behavior: "smooth", block: "start"});
        categoryButtons.find((button) => button.dataset.category === selectedCategory)?.focus();
    });
    document.getElementById("complete-report-demo").addEventListener("click", () => {
        reviewPanel.hidden = true;
        completePanel.hidden = false;
        completePanel.focus();
        completePanel.scrollIntoView({behavior: "smooth", block: "center"});
    });
    document.getElementById("start-again").addEventListener("click", () => clearReport());
    window.addEventListener("beforeunload", () => Object.values(evidence).forEach(revokeEvidenceUrl));

    updateCounts();
})();
