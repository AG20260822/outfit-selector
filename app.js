/*
  INDEX · OUTFIT SELECTOR

  This version starts with an empty closet.

  Your clothing photos are stored locally in the browser,
  not in GitHub.

  The initial 10 placeholder items have intentionally been removed.
*/

const LIBRARY_VERSION = "fresh-library-1";

let W = [];
let unavailable = [];
let feedback = [];

const $ = s => document.querySelector(s);

/* -------------------------------------------------------
   START WITH A FRESH CLOTHING LIBRARY
------------------------------------------------------- */

try {
  const savedVersion =
    localStorage.getItem("libraryVersion");

  if (savedVersion !== LIBRARY_VERSION) {
    /*
      We are intentionally starting from scratch.

      This removes any clothing items that may have been
      added during the previous testing version.
    */
    localStorage.removeItem("addedWardrobe");

    localStorage.setItem(
      "libraryVersion",
      LIBRARY_VERSION
    );

    localStorage.removeItem("unavailable");
  }
} catch (e) {
  console.warn(
    "Could not initialize library version.",
    e
  );
}

try {
  unavailable = JSON.parse(
    localStorage.getItem("unavailable") || "[]"
  );
} catch (e) {
  unavailable = [];
}

try {
  feedback = JSON.parse(
    localStorage.getItem("outfitFeedback") || "[]"
  );
} catch (e) {
  feedback = [];
}

try {
  const added = JSON.parse(
    localStorage.getItem("addedWardrobe") || "[]"
  );

  if (Array.isArray(added)) {
    W = added;
  }
} catch (e) {
  W = [];
}

/* -------------------------------------------------------
   INITIALIZE
------------------------------------------------------- */

function init() {
  let mood = "any";
  let style = "any";
  let weather = "mild";
  let chosen = null;
  let current = [];

  const picker = $("#picker");

  /*
    Make the dialog available to the existing inline
    close button in index.html.
  */
  window.picker = picker;

  /*
    IMPORTANT:
    Remove the camera-only instruction from the file input.

    This means iPhone can offer:
    - Take Photo
    - Choose Existing Photo
    - potentially other photo sources
  */
  const photoInput = $("#photoInput");

  if (photoInput) {
    photoInput.removeAttribute("capture");
  }

  /* -----------------------------------------------------
     BASIC HELPERS
  ----------------------------------------------------- */

  const available = () =>
    W.filter(
      x => !unavailable.includes(x.id)
    );

  function updateCount() {
    const count = $("#count");

    if (count) {
      count.textContent = W.length;
    }
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* -----------------------------------------------------
     FEEDBACK
  ----------------------------------------------------- */

  function recordFeedback(kind, outfit) {
    feedback.push({
      kind,
      outfit: outfit.map(x => x.id),
      at: Date.now()
    });

    if (feedback.length > 100) {
      feedback = feedback.slice(-100);
    }

    localStorage.setItem(
      "outfitFeedback",
      JSON.stringify(feedback)
    );
  }

  function feedbackBias(x) {
    let yes = 0;
    let no = 0;

    feedback.forEach(f => {
      if (f.outfit.includes(x.id)) {
        if (f.kind === "yes") {
          yes++;
        }

        if (f.kind === "no") {
          no++;
        }
      }
    });

    return yes * 2 - no * 3;
  }

  /* -----------------------------------------------------
     ITEM CARD
  ----------------------------------------------------- */

  function card(x) {
    const image = x.image
      ? `
        <img
          src="${x.image}"
          alt="${escapeHTML(x.name)}"
          loading="lazy"
        >
      `
      : "";

    return `
      <div
        class="item ${
          unavailable.includes(x.id)
            ? "unavail"
            : ""
        }"
        data-id="${escapeHTML(x.id)}"
      >

        ${
          unavailable.includes(x.id)
            ? '<span class="badge">Unavailable</span>'
            : ""
        }

        ${image}

        <div class="meta">
          <b>${escapeHTML(x.name)}</b>
          <small>${escapeHTML(x.note || "")}</small>
        </div>

      </div>
    `;
  }

  /* -----------------------------------------------------
     CLOSET
  ----------------------------------------------------- */

  function renderCloset() {
    const closet = $("#closet");

    if (!closet) return;

    updateCount();

    if (W.length === 0) {
      closet.innerHTML = `
        <div
          style="
            grid-column:1/-1;
            padding:22px 8px;
            text-align:center;
            color:#777;
          "
        >
          <div style="font-size:34px;margin-bottom:8px">
            👗
          </div>

          <b>Your closet is empty</b>

          <div style="margin-top:5px">
            Add your first clothing photo below.
          </div>
        </div>
      `;

      return;
    }

    closet.innerHTML = W.map(card).join("");

    document
      .querySelectorAll("#closet .item")
      .forEach(el => {
        el.onclick = () => {
          chosen = W.find(
            x => x.id === el.dataset.id
          );

          if (chosen) {
            showChoice(chosen);
          }
        };
      });
  }

  /* -----------------------------------------------------
     COMPATIBILITY
  ----------------------------------------------------- */

  function compatible(a, b) {
    if (
      a.type === "bottom" &&
      b.type === "bottom"
    ) {
      return false;
    }

    if (
      a.type === "shoes" &&
      b.type === "shoes"
    ) {
      return false;
    }

    if (
      a.type === "top" &&
      b.type === "top"
    ) {
      return false;
    }

    /*
      A camisole should not normally be paired with
      another top.
    */
    if (
      (
        a.type === "top" &&
        b.type === "top"
      )
    ) {
      return false;
    }

    return true;
  }

  /* -----------------------------------------------------
     SCORING
  ----------------------------------------------------- */

  function score(x) {
    let s = 2;

    /*
      We don't rely on the old item IDs anymore.

      Instead, use the item's category and text to
      provide some basic styling intelligence.
    */

    const text = (
      x.name +
      " " +
      (x.note || "")
    ).toLowerCase();

    if (mood === "comfy") {
      if (
        text.includes("comfy") ||
        text.includes("comfortable") ||
        text.includes("soft")
      ) {
        s += 7;
      }
    }

    if (mood === "good") {
      if (
        text.includes("favorite") ||
        text.includes("love") ||
        text.includes("like")
      ) {
        s += 5;
      }
    }

    if (style === "casual") {
      if (
        text.includes("casual") ||
        text.includes("jean") ||
        text.includes("sneaker")
      ) {
        s += 6;
      }
    }

    if (style === "semi") {
      if (
        text.includes("blazer") ||
        text.includes("shirt") ||
        text.includes("trouser") ||
        text.includes("loafer")
      ) {
        s += 6;
      }
    }

    if (style === "interesting") {
      if (
        text.includes("statement") ||
        text.includes("interesting") ||
        text.includes("bold") ||
        text.includes("pattern") ||
        text.includes("stripe")
      ) {
        s += 7;
      }
    }

    if (weather === "cold") {
      if (
        x.type === "layer" ||
        text.includes("sweater") ||
        text.includes("jacket") ||
        text.includes("coat")
      ) {
        s += 6;
      }
    }

    if (weather === "warm") {
      if (
        text.includes("light") ||
        text.includes("linen") ||
        text.includes("camisole") ||
        text.includes("short")
      ) {
        s += 5;
      }
    }

    return (
      s +
      feedbackBias(x) +
      Math.random() * 2
    );
  }

  /* -----------------------------------------------------
     PICK ONE ITEM OF A TYPE
  ----------------------------------------------------- */

  function pickType(type, currentOutfit) {
    const pool = available().filter(
      x =>
        x.type === type &&
        !currentOutfit.some(
          y => y.id === x.id
        ) &&
        currentOutfit.every(
          y => compatible(y, x)
        )
    );

    if (!pool.length) {
      return null;
    }

    return pool.sort(
      (a, b) => score(b) - score(a)
    )[0];
  }

  /* -----------------------------------------------------
     GENERATE OUTFIT
  ----------------------------------------------------- */

  function generate(seed = null) {
    const pool = available();

    if (!pool.length) {
      return [];
    }

    const r = seed ? [seed] : [];

    /*
      If the user chose a starting item,
      make sure we don't accidentally duplicate it.
    */

    /* Bottom */
    if (
      !r.some(x => x.type === "bottom")
    ) {
      const bottom = pickType(
        "bottom",
        r
      );

      if (bottom) {
        r.push(bottom);
      }
    }

    /* Top */
    if (
      !r.some(x => x.type === "top")
    ) {
      const topCandidates = pool
        .filter(
          x =>
            x.type === "top" &&
            !r.some(
              y => y.id === x.id
            ) &&
            r.every(
              y => compatible(y, x)
            )
        )
        .sort(
          (a, b) => score(b) - score(a)
        );

      if (topCandidates[0]) {
        r.push(topCandidates[0]);
      }
    }

    /* Layer for cold weather */
    if (weather === "cold") {
      const layer = pickType(
        "layer",
        r
      );

      if (layer) {
        r.push(layer);
      }
    }

    /* Shoes */
    const shoes = pickType(
      "shoes",
      r
    );

    if (shoes) {
      r.push(shoes);
    }

    /* Accessory */
    if (
      mood === "good" ||
      style === "semi" ||
      style === "interesting"
    ) {
      const accessory = pickType(
        "accessory",
        r
      );

      if (accessory) {
        r.push(accessory);
      }
    }

    return r;
  }

  /* -----------------------------------------------------
     SHOW EMPTY-CLOSET MESSAGE
  ----------------------------------------------------- */

  function showEmptyCloset() {
    $("#result").classList.add("show");

    $("#result").innerHTML = `
      <div class="section-title">
        YOUR CLOSET IS EMPTY
      </div>

      <h2>
        Let's add your first piece.
      </h2>

      <p>
        Take a photo or choose an existing
        photo from your phone.
      </p>

      <div class="tools">
        <button id="addFirst">
          📸 Add my first clothing photo
        </button>
      </div>
    `;

    $("#addFirst").onclick = () => {
      $("#photoInput").click();
    };

    $("#result").scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }

  /* -----------------------------------------------------
     SHOW OUTFIT
  ----------------------------------------------------- */

  function show(title, outfit, note) {
    current = outfit;

    if (!outfit.length) {
      showEmptyCloset();
      return;
    }

    $("#result").classList.add("show");

    $("#result").innerHTML = `
      <div class="section-title">
        STYLIST SUGGESTION
      </div>

      <h2>
        ${escapeHTML(title)}
      </h2>

      <p>
        ${
          chosen
            ? `🔒 ${escapeHTML(chosen.name)} stays — I’ll change the pieces around it.`
            : escapeHTML(note || "")
        }
      </p>

      <div class="look">
        ${outfit.map(card).join("")}
      </div>

      <div class="tools">

        <button id="like">
          ❤️ Yes
        </button>

        <button id="dislike">
          👎 No
        </button>

        <button id="new">
          ↻ Try another
        </button>

        <button id="change">
          🔄 Change one thing
        </button>

        <button id="alts">
          🎲 Alternatives
        </button>

      </div>

      <div
        id="feedback-note"
        class="hint"
      ></div>
    `;

    $("#result")
      .querySelectorAll(".item")
      .forEach(el => {
        el.onclick = () => {
          toggle(el.dataset.id);
        };
      });

    $("#like").onclick = () => {
      recordFeedback(
        "yes",
        current
      );

      $("#feedback-note").textContent =
        "Got it ❤️ I’ll use that signal for future suggestions.";
    };

    $("#dislike").onclick = () => {
      recordFeedback(
        "no",
        current
      );

      $("#feedback-note").textContent =
        "Got it 👌 I’ll use that signal for future suggestions.";
    };

    $("#new").onclick = () => {
      const anchor = chosen || null;

      show(
        title,
        generate(anchor),
        anchor
          ? `Same ${anchor.name}, with a different combination around it.`
          : "Another option based on your current choices."
      );
    };

    $("#change").onclick =
      changeOne;

    $("#alts").onclick =
      alternatives;

    $("#result").scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }

  /* -----------------------------------------------------
     TOGGLE ITEM AVAILABILITY
  ----------------------------------------------------- */

  function toggle(id) {
    unavailable =
      unavailable.includes(id)
        ? unavailable.filter(
            x => x !== id
          )
        : [
            ...unavailable,
            id
          ];

    localStorage.setItem(
      "unavailable",
      JSON.stringify(unavailable)
    );

    renderCloset();
  }

  /* -----------------------------------------------------
     START WITH AN ITEM
  ----------------------------------------------------- */

  function openPicker() {
    const grid = $("#pickgrid");

    if (!available().length) {
      picker.close();
      showEmptyCloset();
      return;
    }

    grid.innerHTML =
      available()
        .map(
          x => `
            <button
              class="pick"
              data-pick="${escapeHTML(x.id)}"
            >

              ${
                x.image
                  ? `
                    <img
                      src="${x.image}"
                      alt="${escapeHTML(x.name)}"
                    >
                  `
                  : ""
              }

              <b>
                ${escapeHTML(x.name)}
              </b>

            </button>
          `
        )
        .join("");

    document
      .querySelectorAll(
        "[data-pick]"
      )
      .forEach(b => {

        b.onclick = () => {

          chosen = W.find(
            x =>
              x.id ===
              b.dataset.pick
          );

          picker.close();

          if (chosen) {
            showChoice(chosen);
          }
        };

      });

    picker.showModal();
  }

  /* -----------------------------------------------------
     SHOW CHOSEN ITEM
  ----------------------------------------------------- */

  function showChoice(item) {
    $("#result").classList.add("show");

    $("#result").innerHTML = `
      <div class="section-title">
        YOUR STARTING POINT
      </div>

      <h2>
        ${escapeHTML(item.name)}
      </h2>

      <div class="look">
        ${card(item)}
      </div>

      <p>
        What should I do with it?
      </p>

      <div class="tools">

        <button id="build">
          ✨ Build me an outfit
        </button>

        <button id="ways">
          🎲 Show me alternatives
        </button>

        <button id="goes">
          👀 What goes with this?
        </button>

      </div>
    `;

    $("#build").onclick = () => {
      show(
        "Built around your choice",
        generate(item),
        "A complete look built around your chosen piece."
      );
    };

    $("#ways").onclick = () => {
      showAlternatives(item);
    };

    $("#goes").onclick = () => {
      showCompatible(item);
    };

    $("#result").scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }

  /* -----------------------------------------------------
     WHAT GOES WITH THIS
  ----------------------------------------------------- */

  function showCompatible(item) {
    const matches = available()
      .filter(
        x =>
          x.id !== item.id &&
          compatible(item, x)
      )
      .sort(
        (a, b) =>
          score(b) - score(a)
      )
      .slice(0, 6);

    $("#result").classList.add("show");

    if (!matches.length) {
      $("#result").innerHTML = `
        <div class="section-title">
          WHAT GOES WITH IT
        </div>

        <h2>
          ${escapeHTML(item.name)}
        </h2>

        <p>
          Add a few more pieces to your closet
          and I'll find combinations for this one.
        </p>
      `;

      return;
    }

    $("#result").innerHTML = `
      <div class="section-title">
        WHAT GOES WITH IT
      </div>

      <h2>
        Good matches for
        ${escapeHTML(item.name)}
      </h2>

      <p>
        Pieces I'd reach for first.
      </p>

      <div class="look">
        ${matches.map(card).join("")}
      </div>

      <div class="tools">
        <button id="build2">
          ✨ Build a complete outfit
        </button>
      </div>
    `;

    $("#build2").onclick = () => {
      show(
        "Built around your choice",
        generate(item),
        "A complete look built around your chosen piece."
      );
    };
  }

  /* -----------------------------------------------------
     THREE ALTERNATIVES
  ----------------------------------------------------- */

  function showAlternatives(item) {
    if (!item) {
      showEmptyCloset();
      return;
    }

    const alternatives = [
      generate(item),
      generate(item),
      generate(item)
    ];

    $("#result").classList.add("show");

    $("#result").innerHTML =
      `
        <div class="section-title">
          ALTERNATIVES
        </div>

        <h2>
          Three ways to wear it
        </h2>

        <p>
          Same starting piece, different directions.
        </p>
      ` +
      alternatives
        .map(
          (outfit, i) => `
            <div style="margin-top:18px">

              <b>
                Option ${i + 1}
              </b>

              <div class="look">
                ${outfit
                  .map(card)
                  .join("")}
              </div>

            </div>
          `
        )
        .join("");
  }

  /* -----------------------------------------------------
     CHANGE ONE THING
  ----------------------------------------------------- */

  function changeOne() {
    if (!current.length) {
      return;
    }

    const choices = current
      .filter(
        x =>
          !chosen ||
          x.id !== chosen.id
      )
      .map(
        x => `
          <button
            class="pick"
            data-change="${escapeHTML(x.id)}"
          >

            ${
              x.image
                ? `
                  <img
                    src="${x.image}"
                    alt="${escapeHTML(x.name)}"
                  >
                `
                : ""
            }

            <b>
              Change ${escapeHTML(x.name)}
            </b>

          </button>
        `
      )
      .join("");

    if (!choices) {
      return;
    }

    $("#pickgrid").innerHTML =
      choices;

    document
      .querySelectorAll(
        "[data-change]"
      )
      .forEach(b => {

        b.onclick = () => {

          const old =
            W.find(
              x =>
                x.id ===
                b.dataset.change
            );

          if (!old) {
            return;
          }

          const replacement =
            available()
              .filter(
                x =>
                  x.type === old.type &&
                  x.id !== old.id &&
                  !current.some(
                    y =>
                      y.id === x.id
                  )
              )
              .sort(
                (a, b) =>
                  score(b) -
                  score(a)
              )[0];

          if (replacement) {

            show(
              "One thing changed",

              current.map(x =>
                x.id === old.id
                  ? replacement
                  : x
              ),

              "Same outfit direction, one fresh piece."
            );

          } else {

            $("#result").innerHTML += `
              <p class="hint">
                You don't have another
                ${escapeHTML(old.type)}
                available yet.
              </p>
            `;
          }

          picker.close();
        };

      });

    picker.showModal();
  }

  /* -----------------------------------------------------
     ALTERNATIVES BUTTON
  ----------------------------------------------------- */

  function alternatives() {
    const seed =
      chosen ||
      current.find(
        x =>
          x.type === "bottom"
      ) ||
      current[0];

    if (!seed) {
      showEmptyCloset();
      return;
    }

    const variants = [
      generate(seed),
      generate(seed),
      generate(seed)
    ];

    $("#result").classList.add("show");

    $("#result").innerHTML =
      `
        <div class="section-title">
          ALTERNATIVES
        </div>

        <h2>
          Three ways to wear it
        </h2>

        <p>
          Same starting point, different feel.
        </p>
      ` +
      variants
        .map(
          (outfit, i) => `
            <div
              style="
                margin-top:18px
              "
            >

              <b>
                Option ${i + 1}
              </b>

              <div class="look">
                ${outfit
                  .map(card)
                  .join("")}
              </div>

            </div>
          `
        )
        .join("");
  }

  /* -----------------------------------------------------
     STYLE CHIPS
  ----------------------------------------------------- */

  document
    .querySelectorAll(
      "#styles .chip"
    )
    .forEach(b => {

      b.onclick = () => {

        document
          .querySelectorAll(
            "#styles .chip"
          )
          .forEach(x =>
            x.classList.remove(
              "active"
            )
          );

        b.classList.add(
          "active"
        );

        style =
          b.dataset.style;
      };

    });

  /* -----------------------------------------------------
     MOOD CHIPS
  ----------------------------------------------------- */

  document
    .querySelectorAll(
      "#moods .chip"
    )
    .forEach(b => {

      b.onclick = () => {

        document
          .querySelectorAll(
            "#moods .chip"
          )
          .forEach(x =>
            x.classList.remove(
              "active"
            )
          );

        b.classList.add(
          "active"
        );

        mood =
          b.dataset.mood;
      };

    });

  /* -----------------------------------------------------
     WEATHER CHIPS
  ----------------------------------------------------- */

  document
    .querySelectorAll(
      "#weather .chip"
    )
    .forEach(b => {

      b.onclick = () => {

        document
          .querySelectorAll(
            "#weather .chip"
          )
          .forEach(x =>
            x.classList.remove(
              "active"
            )
          );

        b.classList.add(
          "active"
        );

        weather =
          b.dataset.weather;
      };

    });

  /* -----------------------------------------------------
     SURPRISE ME
  ----------------------------------------------------- */

  $("#surprise").onclick = () => {

    if (!W.length) {
      showEmptyCloset();
      return;
    }

    show(
      "A surprise for today",
      generate(),
      "Based on your style direction, mood and weather."
    );
  };

  /* -----------------------------------------------------
     START WITH AN ITEM
  ----------------------------------------------------- */

  $("#start").onclick =
    openPicker;

  /* -----------------------------------------------------
     ADD CLOTHING PHOTO
  ----------------------------------------------------- */

  $("#addItem").onclick = () => {

    /*
      Make absolutely sure the input is NOT
      camera-only.

      This is also done above during initialization.
    */
    photoInput.removeAttribute(
      "capture"
    );

    photoInput.click();
  };

  /* -----------------------------------------------------
     PHOTO SELECTED
  ----------------------------------------------------- */

  photoInput.onchange = async e => {

    const file =
      e.target.files &&
      e.target.files[0];

    if (!file) {
      return;
    }

    /*
      Make sure it is actually an image.
    */
    if (
      !file.type ||
      !file.type.startsWith("image/")
    ) {
      alert(
        "Please choose an image."
      );

      photoInput.value = "";
      return;
    }

    const objectURL =
      URL.createObjectURL(file);

    const img =
      new Image();

    img.onload = () => {

      try {

        /*
          Compress the photo before storing it.

          This keeps the local browser storage
          from filling up too quickly.
        */

        const max = 1000;

        const scale =
          Math.min(
            1,
            max /
              Math.max(
                img.width,
                img.height
              )
          );

        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width =
          Math.max(
            1,
            Math.round(
              img.width * scale
            )
          );

        canvas.height =
          Math.max(
            1,
            Math.round(
              img.height * scale
            )
          );

        const ctx =
          canvas.getContext(
            "2d"
          );

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const photo =
          canvas.toDataURL(
            "image/jpeg",
            0.76
          );

        $("#photoPreview").src =
          photo;

        $("#addForm").style.display =
          "block";

        $("#itemName").value = "";

        $("#itemName").focus();

      } finally {

        URL.revokeObjectURL(
          objectURL
        );

      }

    };

    img.onerror = () => {

      URL.revokeObjectURL(
        objectURL
      );

      alert(
        "I couldn't read that photo. Please try another one."
      );

    };

    img.src = objectURL;
  };

  /* -----------------------------------------------------
     SAVE NEW CLOTHING ITEM
  ----------------------------------------------------- */

  $("#saveItem").onclick = () => {

    const name =
      $("#itemName")
        .value
        .trim();

    const type =
      $("#itemType").value;

    const image =
      $("#photoPreview").src;

    if (!name) {

      alert(
        "Please give this item a name."
      );

      $("#itemName").focus();

      return;
    }

    if (
      !image ||
      image ===
        window.location.href
    ) {

      alert(
        "Please add a clothing photo first."
      );

      return;
    }

    const item = {

      id:
        "photo-" +
        Date.now(),

      name,

      type,

      image,

      note:
        "Added from phone"

    };

    let added = [];

    try {

      added = JSON.parse(
        localStorage.getItem(
          "addedWardrobe"
        ) || "[]"
      );

      if (!Array.isArray(added)) {
        added = [];
      }

    } catch (e) {

      added = [];

    }

    added.push(item);

    try {

      localStorage.setItem(
        "addedWardrobe",
        JSON.stringify(added)
      );

    } catch (e) {

      /*
        If the browser runs out of local storage,
        don't silently lose the item.
      */

      alert(
        "The photo is too large for the browser's local storage. Please try a smaller photo."
      );

      return;
    }

    W.push(item);

    renderCloset();

    /*
      Clear the add form.
    */

    $("#itemName").value = "";

    photoInput.value = "";

    $("#addForm").style.display =
      "none";

    $("#photoPreview").src =
      "";

    /*
      Show a small confirmation.
    */

    $("#result").classList.add(
      "show"
    );

    $("#result").innerHTML = `
      <div class="section-title">
        ADDED TO YOUR CLOSET
      </div>

      <h2>
        ${escapeHTML(item.name)}
      </h2>

      <div class="look">
        ${card(item)}
      </div>

      <p>
        Your closet now has
        <b>${W.length}</b>
        ${W.length === 1 ? "piece" : "pieces"}.
      </p>

      <div class="tools">

        <button id="addAnother">
          📸 Add another
        </button>

        <button id="styleThis">
          ✨ Style this
        </button>

      </div>
    `;

    $("#addAnother").onclick =
      () => {
        photoInput.click();
      };

    $("#styleThis").onclick =
      () => {
        chosen = item;

        showChoice(item);
      };

    $("#result").scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  };

  /* -----------------------------------------------------
     RESET
  ----------------------------------------------------- */

  $("#reset").onclick = () => {

    unavailable = [];

    localStorage.removeItem(
      "unavailable"
    );

    renderCloset();

    /*
      If there are no clothing items,
      show the empty state.
    */

    if (!W.length) {
      showEmptyCloset();
    }
  };

  /* -----------------------------------------------------
     FIRST RENDER
  ----------------------------------------------------- */

  renderCloset();

  /*
    Make the current state obvious when starting
    from scratch.
  */

  if (!W.length) {
    console.log(
      "INDEX wardrobe is ready for its first clothing photo."
    );
  }
}

/* -------------------------------------------------------
   RUN
------------------------------------------------------- */

init();
