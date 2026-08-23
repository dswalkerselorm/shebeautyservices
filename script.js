(function () {
  'use strict';

  // ── Utilities ──
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const yearElements = document.querySelectorAll("[data-year]");
  yearElements.forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ── Header & Scroll ──
  var header = document.getElementById("siteHeader");
  var scrollTopBtn = document.getElementById("scrollTopBtn");

  function updateHeaderState() {
    if (!header) return;
    if (window.scrollY > 28) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }

  function updateParallax() {
    if (reduceMotion) return;
    var offset = Math.min(window.scrollY * 0.1, 70);
    document.documentElement.style.setProperty("--parallax", offset + "px");
  }

  function onScroll() {
    updateHeaderState();
    updateParallax();
    if (scrollTopBtn) {
      scrollTopBtn.classList.toggle("is-visible", window.scrollY > 300);
    }
  }

  var scrollRAF = 0;
  window.addEventListener("scroll", function () {
    if (scrollRAF) return;
    scrollRAF = requestAnimationFrame(function () {
      onScroll();
      scrollRAF = 0;
    });
  }, { passive: true });

  updateHeaderState();
  updateParallax();
  onScroll();

  // ── Mobile Navigation ──
  var menuToggle = document.getElementById("menuToggle");
  var siteNav = document.getElementById("siteNav");

  if (menuToggle && siteNav) {
    var mobileNavQuery = window.matchMedia("(max-width: 768px)");
    siteNav.setAttribute("aria-hidden", String(mobileNavQuery.matches));

    mobileNavQuery.addEventListener("change", function (event) {
      if (!event.matches) {
        menuToggle.setAttribute("aria-expanded", "false");
        siteNav.classList.remove("is-open");
      }
      siteNav.setAttribute("aria-hidden", String(event.matches && !siteNav.classList.contains("is-open")));
    });

    menuToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isExpanded));
      siteNav.classList.toggle("is-open", !isExpanded);
      siteNav.setAttribute("aria-hidden", String(isExpanded));
    });

    siteNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menuToggle.setAttribute("aria-expanded", "false");
        siteNav.classList.remove("is-open");
        siteNav.setAttribute("aria-hidden", "true");
      });
    });

    document.addEventListener("click", function (event) {
      if (!siteNav.classList.contains("is-open")) return;
      if (!siteNav.contains(event.target) && !menuToggle.contains(event.target)) {
        menuToggle.setAttribute("aria-expanded", "false");
        siteNav.classList.remove("is-open");
        siteNav.setAttribute("aria-hidden", "true");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !siteNav.classList.contains("is-open")) return;
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
      siteNav.setAttribute("aria-hidden", "true");
      menuToggle.focus();
    });
  }

  // ── Scroll Reveal ──
  var revealElements = document.querySelectorAll("[data-reveal]");
  if (revealElements.length > 0 && "IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.16 }
    );
    revealElements.forEach(function (element) { revealObserver.observe(element); });
  } else {
    revealElements.forEach(function (element) { element.classList.add("is-visible"); });
  }

  // ── Video Autoplay & Reel Player Controls ──
  var showcaseVideoCards = document.querySelectorAll(".showcase-video-card");

  showcaseVideoCards.forEach(function (card) {
    var video = card.querySelector(".showcase-video-el");
    var wrapper = card.querySelector(".card-media-wrapper");
    var centerIndicator = card.querySelector(".video-center-indicator");
    var toggleSoundBtn = card.querySelector(".toggle-sound-btn");
    var expandBtn = card.querySelector(".expand-lightbox-btn");
    var progressFill = card.querySelector(".video-progress-fill");

    if (!video || !wrapper) return;

    // Autoplay when card comes into view
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var p = video.play();
            if (p !== undefined) p.catch(function () {});
            if (centerIndicator) centerIndicator.classList.remove("is-paused");
          } else {
            video.pause();
            if (centerIndicator) centerIndicator.classList.add("is-paused");
          }
        });
      }, { threshold: 0.25 });
      observer.observe(card);
    }

    // Toggle Play/Pause on Video Wrapper Click
    wrapper.addEventListener("click", function (e) {
      if (e.target.closest(".video-action-bar")) return; // don't toggle if clicking buttons

      if (video.paused) {
        video.play();
        if (centerIndicator) centerIndicator.classList.remove("is-paused");
      } else {
        video.pause();
        if (centerIndicator) centerIndicator.classList.add("is-paused");
      }
    });

    // Sound toggle
    if (toggleSoundBtn) {
      var iconMuted = toggleSoundBtn.querySelector(".icon-muted");
      var iconUnmuted = toggleSoundBtn.querySelector(".icon-unmuted");

      toggleSoundBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        video.muted = !video.muted;
        if (iconMuted && iconUnmuted) {
          iconMuted.style.display = video.muted ? "block" : "none";
          iconUnmuted.style.display = video.muted ? "none" : "block";
        }
      });
    }

    // Expand to Lightbox
    if (expandBtn) {
      expandBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        openLightbox(card);
      });
    }

    // Update progress bar
    if (progressFill) {
      video.addEventListener("timeupdate", function () {
        if (video.duration) {
          var pct = (video.currentTime / video.duration) * 100;
          progressFill.style.width = pct + "%";
        }
      });
    }
  });

  // ── Lightbox ──
  var photoCards = document.querySelectorAll(".showcase-photo-card");
  var lightbox = document.getElementById("lightbox");
  var lightboxClose = document.getElementById("lightboxClose");
  var lightboxBody = document.getElementById("lightboxBody");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lightboxTrigger = null;

  function handleFocusTrap(e) {
    if (e.key !== "Tab" || !lightbox || lightbox.hidden) return;
    var focusableEls = lightbox.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableEls.length === 0) return;

    var firstEl = focusableEls[0];
    var lastEl = focusableEls[focusableEls.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstEl) {
        lastEl.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastEl) {
        firstEl.focus();
        e.preventDefault();
      }
    }
  }

  function openLightbox(card) {
    if (!lightbox || !lightboxBody || !lightboxCaption) return;

    var src = card.getAttribute("data-src");
    var kind = card.getAttribute("data-kind");
    var caption = card.getAttribute("data-caption") || "";
    if (!src || !kind) return;

    lightboxBody.innerHTML = "";
    if (kind === "video") {
      var video = document.createElement("video");
      video.src = src;
      video.controls = true;
      video.muted = false;
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;
      lightboxBody.appendChild(video);
      var playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(function () {});
      }
    } else {
      var image = document.createElement("img");
      image.src = src;
      image.alt = caption;
      lightboxBody.appendChild(image);
    }

    lightboxCaption.textContent = caption;
    lightboxTrigger = card;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    if (lightboxClose) {
      lightboxClose.focus();
    }

    document.addEventListener("keydown", handleFocusTrap);
  }

  function closeLightbox() {
    if (!lightbox || !lightboxBody) return;
    var playingVideos = lightboxBody.querySelectorAll("video");
    playingVideos.forEach(function (v) {
      v.pause();
      v.removeAttribute("src");
      v.load();
    });
    lightbox.hidden = true;
    lightboxBody.innerHTML = "";
    document.body.style.overflow = "";
    if (lightboxTrigger) {
      lightboxTrigger.focus();
      lightboxTrigger = null;
    }
    document.removeEventListener("keydown", handleFocusTrap);
  }

  // Click on photo cards opens lightbox
  photoCards.forEach(function (card) {
    card.addEventListener("click", function () { openLightbox(card); });
    card.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(card);
      }
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeLightbox();
    }
  });

  // ── Booking Form ──
  var bookingForm = document.getElementById("bookingForm");
  var appointmentDateField = document.getElementById("appointmentDate");
  var appointmentTypeField = document.getElementById("appointmentType");
  var appointmentLocationField = document.getElementById("appointmentLocation");
  var appointmentLocationGroup = document.getElementById("appointmentLocationGroup");
  var appointmentTypeNote = document.getElementById("appointmentTypeNote");
  var formMessage = document.getElementById("formMessage");
  var successCard = document.getElementById("successCard");
  var successMessage = document.getElementById("successMessage");
  var stepIndicators = document.querySelectorAll("[data-step-indicator]");
  var formSteps = document.querySelectorAll(".form-step");
  var nextStepBtn = document.getElementById("nextStepBtn");
  var prevStepBtn = document.getElementById("prevStepBtn");
  var submitBookingBtn = document.getElementById("submitBookingBtn");

  var reviewTargets = {
    fullName: document.querySelector("[data-review='fullName']"),
    phone: document.querySelector("[data-review='phone']"),
    service: document.querySelector("[data-review='service']"),
    appointmentDate: document.querySelector("[data-review='appointmentDate']"),
    appointmentTime: document.querySelector("[data-review='appointmentTime']"),
    appointmentType: document.querySelector("[data-review='appointmentType']"),
    appointmentLocation: document.querySelector("[data-review='appointmentLocation']")
  };

  var currentStep = 1;
  var maxStep = 3;

  function setFieldError(fieldName, message) {
    var errorElement = document.querySelector("[data-error-for='" + fieldName + "']");
    var field = document.getElementById(fieldName);
    if (errorElement) {
      errorElement.textContent = message;
    }
    if (field) {
      field.setAttribute("aria-invalid", message ? "true" : "false");
      if (message && errorElement && errorElement.id) {
        field.setAttribute("aria-describedby", errorElement.id);
      }
    }
  }

  function clearFieldErrors() {
    var errorElements = document.querySelectorAll(".field-error");
    errorElements.forEach(function (element) {
      element.textContent = "";
    });
    document.querySelectorAll("[aria-invalid='true']").forEach(function (field) {
      field.setAttribute("aria-invalid", "false");
      field.removeAttribute("aria-describedby");
    });
  }

  function getFieldValue(name) {
    if (!bookingForm) return "";
    var value = new FormData(bookingForm).get(name);
    return typeof value === "string" ? value.trim() : "";
  }

  function isShopAppointment() {
    return getFieldValue("appointmentType") === "Shop Appointment";
  }

  function updateAppointmentLocationField() {
    if (!appointmentLocationField || !appointmentLocationGroup) return;

    var shopAppointment = isShopAppointment();
    var appointmentType = getFieldValue("appointmentType");
    appointmentLocationGroup.hidden = shopAppointment;
    appointmentLocationField.required = !shopAppointment;
    appointmentLocationField.disabled = shopAppointment;

    if (appointmentTypeNote) {
      var guidance = {
        "Shop Appointment": "Visit us at the studio for your appointment.",
        "Home Service": "We will come to your preferred address.",
        "Travel": "Tell us where you would like us to meet you."
      };
      appointmentTypeNote.textContent = guidance[appointmentType] || "Choose the setting that works best for you.";
    }

    if (appointmentLocationField) {
      appointmentLocationField.placeholder = appointmentType === "Travel"
        ? "Enter your preferred meeting location"
        : "Enter your service address";
    }

    if (shopAppointment) {
      appointmentLocationField.value = "";
      setFieldError("appointmentLocation", "");
    }
  }

  function validateStep(step) {
    clearFieldErrors();
    var isValid = true;
    var firstInvalidField = null;

    function invalidate(fieldName, message) {
      setFieldError(fieldName, message);
      if (!firstInvalidField) firstInvalidField = document.getElementById(fieldName);
      isValid = false;
    }

    if (step === 1) {
      var fullName = getFieldValue("fullName");
      var phone = getFieldValue("phone");
      if (!fullName) {
        invalidate("fullName", "Please enter your full name.");
      }
      if (!phone) {
        invalidate("phone", "Please enter your phone number.");
      } else if (phone.replace(/\D/g, "").length < 7) {
        invalidate("phone", "Please enter a valid phone number.");
      }
    }

    if (step === 2) {
      var service = getFieldValue("service");
      var appointmentDate = getFieldValue("appointmentDate");
      var appointmentTime = getFieldValue("appointmentTime");
      var appointmentType = getFieldValue("appointmentType");
      var appointmentLocation = getFieldValue("appointmentLocation");

      if (!service) {
        invalidate("service", "Please select a service.");
      }

      if (!appointmentDate) {
        invalidate("appointmentDate", "Please select an appointment date.");
      } else {
        var selectedDate = new Date(appointmentDate + "T00:00:00");
        var today = new Date(new Date().toDateString());
        if (selectedDate < today) {
          invalidate("appointmentDate", "Please choose a future or current date.");
        }
      }

      if (!appointmentType) {
        invalidate("appointmentType", "Please select an appointment type.");
      }

      if (!appointmentTime) {
        invalidate("appointmentTime", "Please select a preferred time.");
      }

      if (!isShopAppointment() && !appointmentLocation) {
        invalidate("appointmentLocation", "Please enter the appointment location.");
      }
    }

    if (!isValid && firstInvalidField) {
      firstInvalidField.focus({ preventScroll: true });
      firstInvalidField.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }

    return isValid;
  }

  function updateReview() {
    if (!bookingForm) return;
    var formData = new FormData(bookingForm);
    Object.keys(reviewTargets).forEach(function (key) {
      var target = reviewTargets[key];
      if (!target) return;

      var value = formData.get(key);
      if (key === "appointmentLocation" && isShopAppointment()) {
        value = "Shop appointment";
      } else if (key === "appointmentDate" && value && typeof value === "string") {
        var parts = value.split("-").map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
          var dt = new Date(parts[0], parts[1] - 1, parts[2]);
          value = dt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          });
        }
      }
      target.textContent = value && typeof value === "string" ? value : "-";
    });
  }

  function renderStep() {
    formSteps.forEach(function (stepEl) {
      var stepNumber = Number(stepEl.getAttribute("data-step"));
      stepEl.classList.toggle("is-current", stepNumber === currentStep);
      stepEl.setAttribute("aria-hidden", String(stepNumber !== currentStep));
    });

    stepIndicators.forEach(function (indicator) {
      var stepNumber = Number(indicator.getAttribute("data-step-indicator"));
      indicator.classList.toggle("is-current", stepNumber === currentStep);
      if (stepNumber === currentStep) {
        indicator.setAttribute("aria-current", "step");
      } else {
        indicator.removeAttribute("aria-current");
      }
    });

    if (prevStepBtn) {
      prevStepBtn.style.display = currentStep === 1 ? "none" : "inline-block";
    }
    if (nextStepBtn) {
      nextStepBtn.style.display = currentStep === maxStep ? "none" : "inline-block";
    }
    if (submitBookingBtn) {
      submitBookingBtn.style.display = currentStep === maxStep ? "inline-block" : "none";
    }

    var progress = document.querySelector(".stepper");
    if (progress) {
      progress.style.setProperty("--current-step", currentStep);
    }

    if (currentStep === maxStep) {
      updateReview();
    }
  }

  if (bookingForm && appointmentDateField && formMessage) {
    if (typeof emailjs !== "undefined") {
      emailjs.init("mxV9OpVpnIpfeUTv-");
    }

    var now = new Date();
    var yearStr = now.getFullYear();
    var monthStr = String(now.getMonth() + 1).padStart(2, "0");
    var dayStr = String(now.getDate()).padStart(2, "0");
    appointmentDateField.min = yearStr + "-" + monthStr + "-" + dayStr;
    updateAppointmentLocationField();
    renderStep();

    if (appointmentTypeField) {
      appointmentTypeField.addEventListener("change", updateAppointmentLocationField);
    }

    bookingForm.querySelectorAll("input, select, textarea").forEach(function (field) {
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true" && field.checkValidity()) {
          setFieldError(field.name, "");
        }
      });
      field.addEventListener("change", function () {
        if (field.getAttribute("aria-invalid") === "true" && field.checkValidity()) {
          setFieldError(field.name, "");
        }
      });
    });

    if (nextStepBtn) {
      nextStepBtn.addEventListener("click", function () {
        if (!validateStep(currentStep)) return;
        currentStep = Math.min(currentStep + 1, maxStep);
        renderStep();
      });
    }

    if (prevStepBtn) {
      prevStepBtn.addEventListener("click", function () {
        clearFieldErrors();
        currentStep = Math.max(currentStep - 1, 1);
        renderStep();
      });
    }

    bookingForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!validateStep(currentStep)) return;

      var formData = new FormData(bookingForm);
      var fullName = formData.get("fullName");
      var phone = formData.get("phone");
      var service = formData.get("service");
      var appointmentDate = formData.get("appointmentDate");
      var appointmentTime = formData.get("appointmentTime");
      var appointmentType = formData.get("appointmentType");
      var appointmentLocation = isShopAppointment()
        ? "Shop appointment"
        : formData.get("appointmentLocation");
      var notes = formData.get("notes");

      var selectedDate = new Date(appointmentDate + "T00:00:00");
      var readableDate = selectedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      var message = "Thank you, " + fullName + ". Your " + service +
        " booking for " + readableDate + " (" + appointmentType +
        ") has been received.";

      if (submitBookingBtn) {
        submitBookingBtn.disabled = true;
        submitBookingBtn.textContent = "Sending...";
      }
      formMessage.textContent = "";
      formMessage.style.color = "";

      var templateParams = {
        from_name: fullName,
        phone: phone,
        service: service,
        date: readableDate,
        time: appointmentTime,
        appointment_type: appointmentType,
        appointment_location: appointmentLocation,
        notes: notes || "No additional notes provided."
      };

      function showSuccess() {
        formMessage.textContent = message;
        if (successCard && successMessage) {
          successMessage.textContent = message;
          bookingForm.style.display = "none";
          successCard.hidden = false;
          var stepper = document.querySelector(".stepper");
          if (stepper) {
            stepper.style.display = "none";
          }
        }
        bookingForm.reset();
        currentStep = 1;
        renderStep();
        clearFieldErrors();
        if (submitBookingBtn) {
          submitBookingBtn.disabled = false;
          submitBookingBtn.textContent = "Submit Booking Request";
        }
      }

      function showSubmissionError() {
        formMessage.textContent =
          "We couldn't send your booking request. Please check your connection and try again.";
        formMessage.style.color = "#ffbadb";
        if (submitBookingBtn) {
          submitBookingBtn.disabled = false;
          submitBookingBtn.textContent = "Submit Booking Request";
        }
      }

      if (typeof emailjs !== "undefined") {
        emailjs
          .send("service_hoc8owm", "template_ve1j1k5", templateParams)
          .then(function () {
            showSuccess();
          })
          .catch(function (error) {
            console.error("EmailJS error:", error);
            showSubmissionError();
          });
      } else {
        showSubmissionError();
      }
    });
  }

  // ── Scroll To Top ──
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
