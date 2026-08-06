const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealElements = () => {
  const elements = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -7% 0px" },
  );

  elements.forEach((element) => observer.observe(element));
};

const setupWhatsAppForms = () => {
  document.querySelectorAll("[data-whatsapp-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const heading = form.dataset.heading || "Nueva consulta desde la web";
      const lines = [heading];

      for (const [key, value] of data.entries()) {
        const cleanValue = String(value).trim();
        if (cleanValue) lines.push(`${key}: ${cleanValue}`);
      }

      const url = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
        lines.join("\n"),
      )}`;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  });
};

/* El destinatario vive en un archivo privado de cPanel. Nunca se publica. */
const EMAIL_ENDPOINT = "api/send-suggestion.php";
const SPINNER_MINIMO = 1800; // ms mínimos que se ve la ruedita de carga

const setupEmailForms = () => {
  document.querySelectorAll("[data-email-form]").forEach((form) => {
    const button = form.querySelector("[data-submit]");
    const spinner = form.querySelector("[data-spinner]");
    const label = form.querySelector("[data-submit-label]");
    const errorEl = form.querySelector("[data-error]");
    const success = form.parentElement?.querySelector("[data-success]");
    const resetBtn = success?.querySelector("[data-reset]");
    const labelInicial = label ? label.textContent.trim() : "Enviar";

    const setCargando = (cargando) => {
      if (button) button.disabled = cargando;
      if (spinner) spinner.hidden = !cargando;
      if (label) label.textContent = cargando ? "Enviando…" : labelInicial;
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (errorEl) errorEl.hidden = true;
      if (!form.reportValidity()) return;

      setCargando(true);
      const inicio = Date.now();

      const data = new FormData(form);
      data.append(
        "Asunto",
        form.dataset.subject || form.dataset.heading || "Nueva consulta desde la web",
      );

      const esperarMinimo = () =>
        new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, SPINNER_MINIMO - (Date.now() - inicio))),
        );

      try {
        const response = await fetch(EMAIL_ENDPOINT, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: data,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.success !== true) {
          throw new Error(payload.message || "No se pudo enviar");
        }

        await esperarMinimo();
        form.hidden = true;
        if (success) {
          success.hidden = false;
          success.focus({ preventScroll: true });
        }
      } catch (error) {
        await esperarMinimo();
        setCargando(false);
        if (errorEl) {
          errorEl.textContent = window.location.hostname.endsWith("github.io")
            ? "Esta es una vista previa. El envío se habilitará en la versión publicada en cPanel."
            : "No pudimos enviar tu sugerencia. Revisá tu conexión y probá de nuevo.";
          errorEl.hidden = false;
        }
      }
    });

    resetBtn?.addEventListener("click", () => {
      form.reset();
      form.hidden = false;
      if (success) success.hidden = true;
      if (errorEl) errorEl.hidden = true;
      setCargando(false);
      form.querySelector("input, textarea")?.focus();
    });
  });
};

const setupMap = () => {
  const trigger = document.querySelector("[data-load-map]");
  if (!trigger) return;

  trigger.addEventListener(
    "click",
    () => {
      const wrapper = trigger.closest("[data-map-wrapper]");
      const iframe = document.createElement("iframe");
      iframe.src =
        "https://maps.google.com/maps?q=Gabriel%20Pereira%203202%20Montevideo&t=&z=15&ie=UTF8&iwloc=&output=embed";
      iframe.title = "Mapa de Heladería Los Trovadores";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      wrapper.replaceChildren(iframe);
    },
    { once: true },
  );
};

const setupFlavors = () => {
  const grid = document.querySelector("[data-flavor-grid]");
  const controls = document.querySelector("[data-flavor-controls]");
  const title = document.querySelector("[data-flavor-title]");
  const sugarFreeImage = document.querySelector("[data-sugar-free-image]");
  if (!grid || !controls || !title || !window.FLAVORS) return;

  const categories = new Map(
    (window.FLAVOR_CATEGORIES || []).map((category) => [
      category.key,
      category.label,
    ]),
  );

  controls.querySelectorAll("[data-category]").forEach((control) => {
    control.setAttribute("aria-controls", grid.id);
  });

  const render = (category) => {
    const matches = window.FLAVORS.filter((item) => item.category === category);
    const activeButton = controls.querySelector(`[data-category="${category}"]`);

    title.textContent = categories.get(category) || "Sabores y productos";
    if (activeButton?.id) grid.setAttribute("aria-labelledby", activeButton.id);
    if (sugarFreeImage) {
      sugarFreeImage.hidden = category !== "sin-azucar";
    }

    grid.innerHTML = matches.length
      ? matches
          .map(
            (item) => `
              <article class="flavor-item">
                <div class="flavor-item__image">
                  ${
                    item.image
                      ? `
                        <img
                          src="${item.image}"
                          alt=""
                          width="160"
                          height="160"
                          loading="lazy"
                        >
                      `
                      : '<span class="visually-hidden">Imagen pendiente</span>'
                  }
                </div>
                <div class="flavor-item__copy">
                  <h3>${item.name}</h3>
                  ${item.description ? `<p>${item.description}</p>` : ""}
                </div>
              </article>
            `,
          )
          .join("")
      : `
        <p class="flavor-empty">
          Consultanos por WhatsApp para conocer la disponibilidad actual de
          esta categoría.
        </p>
      `;
  };

  const scrollToResults = () => {
    requestAnimationFrame(() => {
      title.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;

    controls.querySelectorAll("[data-category]").forEach((control) => {
      const active = control === button;
      control.setAttribute("aria-selected", String(active));
      control.tabIndex = active ? 0 : -1;
    });

    render(button.dataset.category);
    scrollToResults();
  });

  controls.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const buttons = [...controls.querySelectorAll("[data-category]")];
    const index = buttons.indexOf(document.activeElement);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = buttons[(index + direction + buttons.length) % buttons.length];
    event.preventDefault();
    next.click();
    next.focus();
  });

  render("clasicos");
};

const setCurrentYearStory = () => {
  document.querySelectorAll("[data-years-since]").forEach((element) => {
    element.textContent = String(new Date().getFullYear() - 1934);
  });
};

const cloneReviewCard = (card) => {
  const clone = card.cloneNode(true);
  clone.dataset.reviewClone = "true";
  clone.setAttribute("aria-hidden", "true");
  clone.querySelectorAll("img").forEach((image) => {
    image.alt = "";
    image.loading = "lazy";
  });
  return clone;
};

const setupReviewMarquees = () => {
  document.querySelectorAll(".review-track").forEach((track) => {
    track.classList.remove("is-looping");
    track.style.removeProperty("--review-loop-distance");
    track.querySelectorAll("[data-review-clone]").forEach((clone) => clone.remove());

    const cards = [...track.children];
    if (cards.length < 2) {
      track.dataset.loopReady = "false";
      return;
    }

    const appendReviewSet = () => {
      const clones = document.createDocumentFragment();
      cards.forEach((card) => clones.append(cloneReviewCard(card)));
      track.append(clones);
    };

    appendReviewSet();

    const firstCard = cards[0];
    const firstClone = track.querySelector("[data-review-clone]");
    const loopDistance = firstClone.offsetLeft - firstCard.offsetLeft;
    if (loopDistance <= 0) return;

    const marquee = track.closest(".review-marquee");
    const viewportWidth = marquee?.clientWidth || window.innerWidth;
    const totalSets = Math.max(2, Math.ceil(viewportWidth / loopDistance) + 2);

    for (let setIndex = 2; setIndex < totalSets; setIndex += 1) {
      appendReviewSet();
    }

    track.style.setProperty("--review-loop-distance", `${-loopDistance}px`);
    track.dataset.loopReady = "true";
    void track.offsetWidth;
    track.classList.add("is-looping");
  });
};

let reviewResizeTimer;
window.addEventListener(
  "resize",
  () => {
    window.clearTimeout(reviewResizeTimer);
    reviewResizeTimer = window.setTimeout(setupReviewMarquees, 180);
  },
  { passive: true },
);

// Único dato que se sincroniza con Google: la cantidad total de reseñas.
// Las tarjetas del carrusel son fijas y se editan a mano en index.html.
const setupGoogleReviewCount = async () => {
  const countElements = document.querySelectorAll("[data-google-review-count]");
  if (!countElements.length || window.location.protocol === "file:") return;

  try {
    const response = await fetch("api/google-reviews.php", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Google reviews unavailable");

    const data = await response.json();
    const count = Number(data.user_ratings_total);
    if (!Number.isFinite(count) || count <= 0) return;

    const formattedCount = `${new Intl.NumberFormat("es-UY").format(count)} reseñas`;
    countElements.forEach((element) => {
      element.textContent = formattedCount;
    });
  } catch {
    // Si Google no responde, queda el número que está escrito en el HTML.
  }
};

document.addEventListener("DOMContentLoaded", () => {
  revealElements();
  setupWhatsAppForms();
  setupEmailForms();
  setupMap();
  setupFlavors();
  setCurrentYearStory();
  setupReviewMarquees();
  setupGoogleReviewCount();
});
