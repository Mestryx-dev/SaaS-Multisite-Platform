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

  function i18nLocale() {
    var loc =
      (window.__MX_I18N__ && window.__MX_I18N__.locale) || "en";
    return String(loc).toLowerCase().startsWith("fr") ? "fr-FR" : "en-US";
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
      var darkLabel =
        btn.getAttribute("data-mx-theme-label-dark") ||
        "Switch to dark theme";
      var lightLabel =
        btn.getAttribute("data-mx-theme-label-light") ||
        "Switch to light theme";
      btn.setAttribute("aria-label", dark ? lightLabel : darkLabel);
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
      $all("[data-mx-gallery-thumb]").forEach(function (other) {
        other.setAttribute("data-active", other === btn ? "true" : "false");
        other.setAttribute("aria-pressed", other === btn ? "true" : "false");
      });
    });
  });

  /* ——— Cart drawer (CSS class motion) ——— */
  var drawer = $("[data-mx-cart-drawer]");
  var overlay = $("[data-mx-cart-overlay]");
  var closeTimer = null;
  var MOTION_MS = 230;
  var lastFocus = null;

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

  function focusableInDrawer() {
    return $all(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      drawer,
    ).filter(function (el) {
      return !el.hasAttribute("hidden") && el.offsetParent !== null;
    });
  }

  function trapFocus(e) {
    if (e.key !== "Tab" || drawer.hidden || !drawer.classList.contains("is-open")) {
      return;
    }
    var nodes = focusableInDrawer();
    if (!nodes.length) return;
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openDrawer() {
    clearCloseTimer();
    lastFocus = document.activeElement;
    drawer.hidden = false;
    if (overlay) overlay.hidden = false;
    document.body.style.overflow = "hidden";
    loadCart();
    if (prefersReducedMotion()) {
      drawer.classList.add("is-open");
      if (overlay) overlay.classList.add("is-open");
      focusFirst();
      return;
    }
    /* Double rAF so the browser paints the closed transform before opening. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        drawer.classList.add("is-open");
        if (overlay) overlay.classList.add("is-open");
        focusFirst();
      });
    });
  }

  function focusFirst() {
    var closeBtn = $("[data-mx-cart-close]", drawer);
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    clearCloseTimer();
    drawer.classList.remove("is-open");
    if (overlay) overlay.classList.remove("is-open");
    document.body.style.overflow = "";

    function hide() {
      drawer.hidden = true;
      if (overlay) overlay.hidden = true;
      if (lastFocus && typeof lastFocus.focus === "function") {
        try {
          lastFocus.focus();
        } catch (e) {
          /* ignore */
        }
      }
    }

    if (prefersReducedMotion()) {
      hide();
      return;
    }

    closeTimer = setTimeout(hide, MOTION_MS);
  }

  function money(cents, currency) {
    try {
      return new Intl.NumberFormat(i18nLocale(), {
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
        var qtyLabel = escapeHtml(tx("store.cart.quantity"));
        var updateLabel = escapeHtml(tx("store.cart.update"));
        var removeLabel = escapeHtml(tx("store.cart.remove"));
        var html = items
          .map(function (i) {
            var lineTotal = money(i.unitPriceCents * i.quantity, i.currency);
            var img = i.imageUrl
              ? "<a href='/p/" +
                encodeURIComponent(i.slug) +
                "' class='shrink-0 overflow-hidden rounded-[var(--radius)]'><img src='" +
                escapeAttr(i.imageUrl) +
                "' alt='" +
                escapeAttr(i.name) +
                "' class='h-20 w-20 object-cover' /></a>"
              : "<div class='h-20 w-20 shrink-0 rounded-[var(--radius)] bg-[var(--muted)]' aria-hidden='true'></div>";
            return (
              "<article class='ui-cart-line'>" +
              img +
              "<div class='flex min-w-0 flex-1 flex-col gap-2'>" +
              "<a href='/p/" +
              encodeURIComponent(i.slug) +
              "' class='font-medium text-[var(--foreground)] hover:underline'>" +
              escapeHtml(i.name) +
              "</a>" +
              "<p class='text-sm font-semibold'>" +
              escapeHtml(lineTotal) +
              "</p>" +
              "<form method='post' action='/actions/update-cart-item' class='flex flex-wrap items-center gap-2'>" +
              "<input type='hidden' name='itemId' value='" +
              escapeAttr(i.id) +
              "' />" +
              "<input type='hidden' name='siteId' value='" +
              escapeAttr(sid) +
              "' />" +
              "<label class='sr-only' for='drawer-qty-" +
              escapeAttr(i.id) +
              "'>" +
              qtyLabel +
              "</label>" +
              "<input id='drawer-qty-" +
              escapeAttr(i.id) +
              "' type='number' name='quantity' min='1' value='" +
              Number(i.quantity) +
              "' class='w-16 rounded-[var(--radius)] border border-[var(--border)] px-2 py-1 text-sm' />" +
              "<button type='submit' class='rounded-[var(--radius)] border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)]'>" +
              updateLabel +
              "</button>" +
              "</form>" +
              "<form method='post' action='/actions/update-cart-item'>" +
              "<input type='hidden' name='itemId' value='" +
              escapeAttr(i.id) +
              "' />" +
              "<input type='hidden' name='siteId' value='" +
              escapeAttr(sid) +
              "' />" +
              "<input type='hidden' name='quantity' value='0' />" +
              "<button type='submit' class='text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)]'>" +
              removeLabel +
              "</button>" +
              "</form>" +
              "</div></article>"
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

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
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
    trapFocus(e);
  });
})();
