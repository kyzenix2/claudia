// Leave a field empty until it is real.
// contractAddress: 0x + 40 hex. twitterUrl / telegramUrl: https links.
// Empty contract stays "TBA". Empty Telegram is removed from the page.
const SITE = {
  contractAddress: "0x4d059c5639c26b78a055ffcf91288257e812c6eb",
  twitterUrl: "https://x.com/claudia_xRobin",
  telegramUrl: "",
};

(function () {
  const CHAIN = "robinhood";
  const CA_RE = /^0x[a-fA-F0-9]{40}$/;

  function realCa() {
    const ca = (SITE.contractAddress || "").trim();
    return CA_RE.test(ca) ? ca : "";
  }

  function safeHttp(url) {
    try {
      const parsed = new URL((url || "").trim());
      if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
    } catch (err) {
      return "";
    }
    return "";
  }

  function setExternal(nodes, url) {
    nodes.forEach(function (anchor) {
      if (!url) {
        anchor.href = "#";
        anchor.removeAttribute("target");
        anchor.removeAttribute("rel");
        anchor.setAttribute("aria-disabled", "true");
        return;
      }
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.removeAttribute("aria-disabled");
    });
  }

  function applySite() {
    const ca = realCa();
    document.querySelectorAll("[data-ca]").forEach(function (el) {
      el.textContent = ca || "TBA";
    });

    const buy = ca
      ? "https://app.uniswap.org/swap?chain=" + CHAIN + "&outputCurrency=" + ca
      : "";
    setExternal(document.querySelectorAll("[data-buy]"), buy);

    const chart = ca ? "https://dexscreener.com/" + CHAIN + "/" + ca : "";
    setExternal(document.querySelectorAll("[data-chart]"), chart);

    const frame = document.getElementById("chart-embed");
    const placeholder = document.getElementById("chart-placeholder");
    if (frame && placeholder) {
      if (chart.indexOf("https://dexscreener.com/") === 0) {
        frame.src = chart + "?embed=1&theme=light&trades=0&info=0";
        frame.classList.remove("hidden");
        placeholder.classList.add("hidden");
      } else {
        frame.removeAttribute("src");
        frame.classList.add("hidden");
        placeholder.classList.remove("hidden");
      }
    }

    setExternal(document.querySelectorAll("[data-x]"), safeHttp(SITE.twitterUrl));

    document.querySelectorAll("[data-pending]").forEach(function (el) {
      el.classList.toggle("hidden", Boolean(ca));
    });

    if (!safeHttp(SITE.telegramUrl)) {
      document.querySelectorAll("[data-telegram]").forEach(function (el) {
        el.remove();
      });
    }
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "0";
      area.style.left = "0";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.focus();
      area.select();
      area.setSelectionRange(0, text.length);
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      area.remove();
      if (ok) resolve();
      else reject(new Error("copy failed"));
    });
  }

  function copyValue(text) {
    const modern = navigator.clipboard && window.isSecureContext
      ? navigator.clipboard.writeText(text)
      : Promise.reject(new Error("no clipboard"));
    return modern.catch(function () {
      return legacyCopy(text);
    });
  }

  document.addEventListener("click", function (event) {
    const disabled = event.target.closest("a[aria-disabled='true']");
    if (disabled) event.preventDefault();

    const button = event.target.closest("[data-copy]");
    if (!button) return;

    const value = realCa() || "TBA";
    copyValue(value).then(function () {
      const status = document.getElementById("copy-status");
      if (status) status.textContent = "Copied!";
      const previous = button.textContent;
      button.textContent = "Copied!";
      button.classList.add("is-copied");
      window.setTimeout(function () {
        button.textContent = previous;
        button.classList.remove("is-copied");
        if (status) status.textContent = "";
      }, 1600);
    }).catch(function () {
      const status = document.getElementById("copy-status");
      if (status) status.textContent = "";
    });
  });

  const nav = document.getElementById("nav");
  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("mobile-menu");
  const iconOpen = document.getElementById("icon-open");
  const iconClose = document.getElementById("icon-close");

  function setMenu(open) {
    menu.classList.toggle("hidden", !open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    iconOpen.classList.toggle("hidden", open);
    iconClose.classList.toggle("hidden", !open);
  }

  toggle.addEventListener("click", function () {
    setMenu(menu.classList.contains("hidden"));
  });

  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  const navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  const sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(function (section, index, list) {
      return section && list.indexOf(section) === index;
    });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const id = "#" + entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("href") === id);
        });
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    sections.forEach(function (section) { observer.observe(section); });
  }

  applySite();
})();
