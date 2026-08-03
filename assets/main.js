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

const createGoogleReviewCard = (review) => {
  const article = document.createElement("article");
  article.className = "review-card";

  const rating = Math.max(1, Math.min(5, Math.round(Number(review.rating) || 5)));
  const stars = document.createElement("div");
  stars.className = "hero__stars";
  stars.setAttribute("aria-label", `${rating} de 5 estrellas`);
  stars.textContent = "★".repeat(rating) + "☆".repeat(5 - rating);

  const quote = document.createElement("blockquote");
  quote.textContent = review.text?.trim()
    ? `“${review.text.trim()}”`
    : `Calificación de ${rating} estrellas en Google.`;

  const author = document.createElement("div");
  author.className = "review-author";

  if (review.profile_photo_url) {
    const image = document.createElement("img");
    image.src = review.profile_photo_url;
    image.alt = "";
    image.width = 128;
    image.height = 128;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    author.append(image);
  } else {
    const fallback = document.createElement("span");
    fallback.className = "review-author__fallback";
    fallback.setAttribute("aria-hidden", "true");
    fallback.textContent = (review.author_name || "G").trim().charAt(0).toUpperCase();
    author.append(fallback);
  }

  const authorCopy = document.createElement("div");
  const cite = document.createElement("cite");
  cite.textContent = review.author_name || "Usuario de Google";
  const small = document.createElement("small");
  small.textContent = review.relative_time_description
    ? `Google · ${review.relative_time_description}`
    : "Reseña publicada en Google";
  authorCopy.append(cite, small);
  author.append(authorCopy);

  article.append(stars, quote, author);
  return article;
};

const setupGoogleReviews = async () => {
  const track = document.querySelector("[data-google-reviews]");
  if (!track || window.location.protocol === "file:") return;

  try {
    const response = await fetch("api/google-reviews.php", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Google reviews unavailable");

    const data = await response.json();

    const rating = Number(data.rating);
    const ratingElement = document.querySelector("[data-google-rating]");
    if (ratingElement && Number.isFinite(rating)) {
      ratingElement.textContent = `${rating.toLocaleString("es-UY", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} / 5`;
    }
    const ratingValueElements = document.querySelectorAll(
      "[data-google-rating-value]",
    );
    if (ratingValueElements.length && Number.isFinite(rating)) {
      const formattedRating = rating.toLocaleString("es-UY", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
      ratingValueElements.forEach((element) => {
        element.textContent = formattedRating;
      });
    }

    const count = Number(data.user_ratings_total);
    const countElements = document.querySelectorAll("[data-google-review-count]");
    if (countElements.length && Number.isFinite(count)) {
      const formattedCount = `${new Intl.NumberFormat("es-UY").format(count)} reseñas`;
      countElements.forEach((element) => {
        element.textContent = formattedCount;
      });
    }

    if (!Array.isArray(data.reviews) || data.reviews.length < 2) return;

    const fragment = document.createDocumentFragment();
    data.reviews.forEach((review) => fragment.append(createGoogleReviewCard(review)));
    track.replaceChildren(fragment);
    track.dataset.loopReady = "false";

    const status = document.querySelector("[data-google-status]");
    if (status) status.textContent = "Últimas reseñas de Google, ordenadas por fecha.";

    setupReviewMarquees();
  } catch {
    const status = document.querySelector("[data-google-status]");
    if (status) {
      status.textContent = "Reseñas destacadas de Google.";
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  revealElements();
  setupWhatsAppForms();
  setupMap();
  setupFlavors();
  setCurrentYearStory();
  setupReviewMarquees();
  setupGoogleReviews();
});
