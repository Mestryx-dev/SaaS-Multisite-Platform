(function () {
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function tx(key, vars) {
    var bag =
      (window.__MX_I18N__ && window.__MX_I18N__.messages) || {};
    var template = bag[key] || key;
    if (!vars) return template;
    return String(template).replace(/\{\{(\w+)\}\}/g, function (_, name) {
      return vars[name] != null ? String(vars[name]) : "{{" + name + "}}";
    });
  }

  function prefersReducedMotion() {
    try {
      return (
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch (e) {
      return false;
    }
  }

  /* ——— Per-site storefront theme (light ↔ dark) ——— */
  function themeStorageKey(btn) {
    return btn.getAttribute("data-mx-theme-storage") || "mx-store-theme";
  }

  function applyStoreTheme(mode) {
    var root = document.documentElement;
    var body = document.body;
    var dark = mode === "dark";
    var theme = dark ? "storefront-dark" : "storefront";
    root.setAttribute("data-theme", theme);
    if (body) body.setAttribute("data-theme", theme);
    root.style.colorScheme = dark ? "dark" : "light";
    $all("[data-mx-theme-toggle]").forEach(function (btn) {
      btn.setAttribute(
        "aria-label",
        dark ? "Switch to light theme" : "Switch to dark theme",
      );
    });
  }

  function initStoreTheme() {
    $all("[data-mx-theme-toggle]").forEach(function (btn) {
      var key = themeStorageKey(btn);
      var saved = null;
      try {
        saved = localStorage.getItem(key);
      } catch (e) {
        /* ignore */
      }
      if (saved === "dark" || saved === "light") {
        applyStoreTheme(saved);
      }
      btn.addEventListener("click", function () {
        var isDark =
          document.documentElement.getAttribute("data-theme") ===
          "storefront-dark";
        var next = isDark ? "light" : "dark";
        applyStoreTheme(next);
        try {
          localStorage.setItem(key, next);
        } catch (e) {
          /* ignore */
        }
      });
    });
  }

  initStoreTheme();

  /* ——— Mobile nav: Escape closes checkbox menu (CSS handles open) ——— */
  function initStoreNav() {
    var check = $("[data-mx-nav-check]");
    if (!check) return;
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (check instanceof HTMLInputElement && check.checked) {
        check.checked = false;
      }
    });
  }

  initStoreNav();

  /* ——— Header: sticky solid bar → floating dock on scroll ——— */
  function initStoreHeaderScroll() {
    var header = $("[data-mx-store-header]") || $(".ui-store-header");
    if (!header) return;
    /* Hysteresis: avoid enter/exit thrash when dock shrink changes layout. */
    var ENTER_Y = 64;
    var EXIT_Y = 8;
    var scrolled = false;
    var ticking = false;

    function apply() {
      var y = window.scrollY || window.pageYOffset || 0;
      var next = scrolled ? y > EXIT_Y : y > ENTER_Y;
      if (next !== scrolled) {
        scrolled = next;
        header.classList.toggle("is-scrolled", scrolled);
      }
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(apply);
      } else {
        apply();
      }
    }

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  initStoreHeaderScroll();

  /* ——— PDP gallery thumbs ——— */
  $all("[data-mx-gallery-thumb]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var main = $("#mx-gallery-main");
      var src = btn.getAttribute("data-src");
      if (main && src && main.tagName === "IMG") {
        main.setAttribute("src", src);
      }
    });
  });

  /* ——— Cart drawer (CSS class motion) ——— */
  var drawer = $("[data-mx-cart-drawer]");
  var overlay = $("[data-mx-cart-overlay]");
  var closeTimer = null;
  var MOTION_MS = 230;

  if (!drawer) return;

  function siteId() {
    return (
      drawer.getAttribute("data-mx-site-id") ||
      ($("[data-mx-site-id]") &&
        $("[data-mx-site-id]").getAttribute("data-mx-site-id")) ||
      ""
    );
  }

  function clearCloseTimer() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function openDrawer() {
    clearCloseTimer();
    drawer.hidden = false;
    if (overlay) overlay.hidden = false;
    document.body.style.overflow = "hidden";
    loadCart();
    if (prefersReducedMotion()) {
      drawer.classList.add("is-open");
      if (overlay) overlay.classList.add("is-open");
      return;
    }
    /* Double rAF so the browser paints the closed transform before opening. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        drawer.classList.add("is-open");
        if (overlay) overlay.classList.add("is-open");
      });
    });
  }

  function closeDrawer() {
    clearCloseTimer();
    drawer.classList.remove("is-open");
    if (overlay) overlay.classList.remove("is-open");
    document.body.style.overflow = "";

    function hide() {
      drawer.hidden = true;
      if (overlay) overlay.hidden = true;
    }

    if (prefersReducedMotion()) {
      hide();
      return;
    }

    closeTimer = setTimeout(hide, MOTION_MS);
  }

  function money(cents, currency) {
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: (currency || "eur").toUpperCase(),
      }).format(cents / 100);
    } catch (e) {
      return (cents / 100).toFixed(2);
    }
  }

  function loadCart() {
    var body = $("[data-mx-cart-body]", drawer);
    if (!body) return;
    var sid = siteId();
    if (!sid) {
      body.innerHTML = "<p>" + escapeHtml(tx("store.cart.unavailable")) + "</p>";
      return;
    }
    var loadingLabel = escapeHtml(tx("store.cart.loading"));
    body.innerHTML =
      '<div class="ui-store-loading ui-store-loading--inline" role="status" aria-busy="true" aria-live="polite" aria-label="' +
      loadingLabel +
      '"><div class="ui-store-loading__stage"><div class="ui-store-loading__mark" aria-hidden="true"><span class="ui-store-loading__ring"></span><span class="ui-store-loading__orbit"></span><span class="ui-store-loading__core">·</span></div><div class="ui-store-loading__copy"><p class="ui-store-loading__status">' +
      loadingLabel +
      '</p></div><div class="ui-store-loading__track" aria-hidden="true"><span class="ui-store-loading__bar"></span></div></div></div>';
    fetch("/actions/cart-json?siteId=" + encodeURIComponent(sid), {
      credentials: "same-origin",
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        var items = (data && data.cart && data.cart.items) || [];
        var sub = (data && data.cart && data.cart.subtotalCents) || 0;
        var cur = (items[0] && items[0].currency) || "eur";
        if (!items.length) {
          body.innerHTML =
            "<p>" +
            escapeHtml(tx("store.cart.empty")) +
            " <a href='/'>" +
            escapeHtml(tx("store.cart.emptyCta")) +
            "</a></p>";
          return;
        }
        var html = items
          .map(function (i) {
            return (
              "<div class='ui-cart-line' style='margin-bottom:1rem'>" +
              "<div><a href='/p/" +
              encodeURIComponent(i.slug) +
              "'>" +
              escapeHtml(i.name) +
              "</a>" +
              "<div>× " +
              i.quantity +
              " — " +
              money(i.unitPriceCents * i.quantity, i.currency) +
              "</div></div></div>"
            );
          })
          .join("");
        html +=
          "<p><strong>" +
          escapeHtml(
            tx("store.cart.subtotal", { amount: money(sub, cur) }),
          ) +
          "</strong></p>";
        body.innerHTML = html;
      })
      .catch(function () {
        body.innerHTML =
          "<p>" +
          escapeHtml(tx("store.cart.error")) +
          " <a href='/cart'>" +
          escapeHtml(tx("store.cart.view")) +
          "</a></p>";
      });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest("[data-mx-theme-toggle]")) return;
    var open = t.closest("[data-mx-cart-open]");
    if (open) {
      e.preventDefault();
      openDrawer();
      return;
    }
    if (t.closest("[data-mx-cart-close]") || t === overlay) {
      closeDrawer();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
  });
})();
