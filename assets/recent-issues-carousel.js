(() => {
    "use strict";

    const AUTOPLAY_DELAY = 5000;
    const TRANSITION_DURATION = 450;
    const TRANSITION_TIMING = "cubic-bezier(0.25, 1, 0.5, 1)";

    const initialiseCarousel = (carousel) => {
        const viewport = carousel.querySelector("[data-carousel-viewport]");
        const track = carousel.querySelector("[data-carousel-track]");
        const originalSlides = Array.from(
            carousel.querySelectorAll("[data-carousel-slide]")
        );
        const controls = carousel.querySelector("[data-carousel-controls]");
        const previousButton = carousel.querySelector(
            "[data-carousel-previous]"
        );
        const nextButton = carousel.querySelector("[data-carousel-next]");
        const status = carousel.querySelector("[data-carousel-status]");

        const totalOriginal = originalSlides.length;
        if (!viewport || !track || totalOriginal === 0) {
            return;
        }

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

        let cloneOffset = 0;
        let domIndex = 0; // Current index in track children
        let visibleSlideCount = 1;
        let isAnimating = false;
        let isLooping = false;
        let autoplayTimer = null;
        let isHovered = false;
        let isPointerDown = false;
        let dragStartX = 0;
        let dragCurrentDiff = 0;

        carousel.classList.add("is-enhanced");

        // Clone slides to create seamless infinite loop (prepend copy + append copy)
        const setupClones = () => {
            if (isLooping || totalOriginal <= 1) {
                return;
            }

            const prependedClones = originalSlides.map((slide) => {
                const clone = slide.cloneNode(true);
                clone.setAttribute("aria-hidden", "true");
                clone.removeAttribute("id");
                clone.querySelectorAll("a, button, input").forEach((el) => {
                    el.setAttribute("tabindex", "-1");
                });
                return clone;
            });

            const appendedClones = originalSlides.map((slide) => {
                const clone = slide.cloneNode(true);
                clone.setAttribute("aria-hidden", "true");
                clone.removeAttribute("id");
                clone.querySelectorAll("a, button, input").forEach((el) => {
                    el.setAttribute("tabindex", "-1");
                });
                return clone;
            });

            prependedClones.forEach((clone) => track.insertBefore(clone, originalSlides[0]));
            appendedClones.forEach((clone) => track.appendChild(clone));

            cloneOffset = totalOriginal;
            domIndex = cloneOffset;
            isLooping = true;
        };

        setupClones();

        const getStep = () => {
            const firstSlide = track.children[0];
            if (!firstSlide) {
                return 0;
            }
            const slideWidth = firstSlide.getBoundingClientRect().width;
            const style = window.getComputedStyle(track);
            const gap = parseFloat(style.columnGap || style.gap) || 18;
            return slideWidth + gap;
        };

        const setTransform = (index, offsetPx = 0) => {
            const step = getStep();
            const targetX = -(index * step) + offsetPx;
            track.style.transform = `translate3d(${targetX}px, 0, 0)`;
        };

        const getLogicalIndex = () => {
            return ((domIndex - cloneOffset) % totalOriginal + totalOriginal) % totalOriginal;
        };

        const updateStatus = (announce = false) => {
            if (!status) {
                return;
            }

            status.setAttribute("aria-live", announce ? "polite" : "off");
            const logical = getLogicalIndex();
            const firstVisible = logical + 1;
            const lastVisible = ((logical + visibleSlideCount - 1) % totalOriginal) + 1;

            status.textContent = firstVisible === lastVisible
                ? `${firstVisible} / ${totalOriginal}`
                : `${firstVisible}\u2013${lastVisible} / ${totalOriginal}`;
        };

        const normalizePosition = () => {
            if (!isLooping) {
                return;
            }

            // If we've slid into the appended clones at the right end:
            if (domIndex >= cloneOffset + totalOriginal) {
                domIndex = domIndex - totalOriginal;
                track.style.transition = "none";
                setTransform(domIndex);
                void track.offsetHeight; // Force reflow
            }
            // If we've slid into the prepended clones at the left end:
            else if (domIndex < cloneOffset) {
                domIndex = domIndex + totalOriginal;
                track.style.transition = "none";
                setTransform(domIndex);
                void track.offsetHeight; // Force reflow
            }
        };

        const updateLayout = () => {
            const firstSlide = track.children[0];
            if (!firstSlide) {
                return;
            }

            const slideWidth = firstSlide.getBoundingClientRect().width;
            const style = window.getComputedStyle(track);
            const gap = parseFloat(style.columnGap || style.gap) || 18;

            visibleSlideCount = Math.max(
                1,
                Math.round((viewport.clientWidth + gap) / (slideWidth + gap))
            );

            const canMove = totalOriginal > visibleSlideCount;

            if (controls) {
                controls.hidden = !canMove;
            }
            if (previousButton) {
                previousButton.disabled = false;
            }
            if (nextButton) {
                nextButton.disabled = false;
            }

            track.style.transition = "none";
            setTransform(domIndex);
            updateStatus();
        };

        const pauseAutoplay = () => {
            if (autoplayTimer) {
                window.clearTimeout(autoplayTimer);
                autoplayTimer = null;
            }
        };

        const canAutoplay = () => (
            totalOriginal > visibleSlideCount
            && !reducedMotion.matches
            && !document.hidden
            && !isHovered
            && !isPointerDown
            && !carousel.contains(document.activeElement)
        );

        const moveBy = (delta, options = {}) => {
            if (isAnimating) {
                return;
            }

            isAnimating = true;
            domIndex += delta;

            const duration = reducedMotion.matches ? 0 : TRANSITION_DURATION;
            track.style.transition = duration ? `transform ${duration}ms ${TRANSITION_TIMING}` : "none";
            setTransform(domIndex);
            updateStatus(options.announce === true);

            const onComplete = () => {
                isAnimating = false;
                normalizePosition();
                updateStatus();
            };

            if (!duration) {
                onComplete();
            } else {
                let completed = false;
                const finishHandler = () => {
                    if (completed) return;
                    completed = true;
                    track.removeEventListener("transitionend", finishHandler);
                    onComplete();
                };
                track.addEventListener("transitionend", finishHandler);
                setTimeout(finishHandler, duration + 30);
            }
        };

        const scheduleAutoplay = () => {
            pauseAutoplay();

            if (!canAutoplay()) {
                return;
            }

            autoplayTimer = window.setTimeout(() => {
                moveBy(1);
                scheduleAutoplay();
            }, AUTOPLAY_DELAY);
        };

        previousButton?.addEventListener("click", () => {
            pauseAutoplay();
            moveBy(-1, { announce: true });
            scheduleAutoplay();
        });

        nextButton?.addEventListener("click", () => {
            pauseAutoplay();
            moveBy(1, { announce: true });
            scheduleAutoplay();
        });

        viewport.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                pauseAutoplay();
                moveBy(-1, { announce: true });
                scheduleAutoplay();
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                pauseAutoplay();
                moveBy(1, { announce: true });
                scheduleAutoplay();
            }
        });

        // Touch & Drag Support
        const onPointerDown = (e) => {
            if (e.button !== 0 && e.pointerType === "mouse") {
                return;
            }
            if (isAnimating) {
                return;
            }

            pauseAutoplay();
            isPointerDown = true;
            dragStartX = e.clientX;
            dragCurrentDiff = 0;
            track.style.transition = "none";
        };

        const onPointerMove = (e) => {
            if (!isPointerDown) {
                return;
            }
            dragCurrentDiff = e.clientX - dragStartX;
            setTransform(domIndex, dragCurrentDiff);
        };

        const onPointerUp = () => {
            if (!isPointerDown) {
                return;
            }
            isPointerDown = false;

            if (dragCurrentDiff < -40) {
                moveBy(1);
            } else if (dragCurrentDiff > 40) {
                moveBy(-1);
            } else {
                // Snap back to current slide
                const duration = 200;
                track.style.transition = `transform ${duration}ms ${TRANSITION_TIMING}`;
                setTransform(domIndex);
            }
            dragCurrentDiff = 0;
            scheduleAutoplay();
        };

        viewport.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);

        carousel.addEventListener("mouseenter", () => {
            isHovered = true;
            pauseAutoplay();
        });

        carousel.addEventListener("mouseleave", () => {
            isHovered = false;
            scheduleAutoplay();
        });

        carousel.addEventListener("focusin", pauseAutoplay);
        carousel.addEventListener("focusout", () => {
            window.setTimeout(scheduleAutoplay, 0);
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                pauseAutoplay();
            } else {
                scheduleAutoplay();
            }
        });

        if ("ResizeObserver" in window) {
            const resizeObserver = new ResizeObserver(() => {
                updateLayout();
                scheduleAutoplay();
            });
            resizeObserver.observe(viewport);
        } else {
            window.addEventListener("resize", () => {
                updateLayout();
                scheduleAutoplay();
            });
        }

        // Init
        updateLayout();
        scheduleAutoplay();
    };

    document.querySelectorAll("[data-recent-issues-carousel]").forEach(
        initialiseCarousel
    );
})();
