const slidesTextBlocks = {};
const undoStack = [];
const redoStack = [];
let selectedBlock = null;

// Initialize Swiper
const swiper = new Swiper(".swiper", {
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  pagination: {
    el: ".swiper-pagination",
  },
  on: {
    slideChange: () => {
      selectedBlock = null; // Reset selected block on slide change
      renderTextBlocks();
    },
  },
});

function getActiveSlideIndex() {
  const activeSlide = document.querySelector(".swiper-slide-active");
  return activeSlide ? activeSlide.dataset.swiperSlideIndex : null;
}

function saveState() {
  const activeIndex = getActiveSlideIndex();
  if (activeIndex !== null) {
    if (!slidesTextBlocks[activeIndex]) slidesTextBlocks[activeIndex] = [];
    undoStack.push(JSON.parse(JSON.stringify(slidesTextBlocks[activeIndex])));
    redoStack.length = 0;
  }
}

function addNewSlide(imageSrc) {
  const slideIndex = swiper.slides.length;
  const slideHTML = `
    <div class="swiper-slide" data-swiper-slide-index="${slideIndex}">
      <img src="${imageSrc}" alt="Slide Image" style="width: 100%; height: 100%" />
      <div class="editor" style="position: relative"></div>
    </div>
  `;
  const wrapper = document.querySelector(".swiper-wrapper");
  wrapper.insertAdjacentHTML("beforeend", slideHTML);

  slidesTextBlocks[slideIndex] = [];
  swiper.update();
  swiper.slideTo(slideIndex);
}

function renderTextBlocks() {
  const activeIndex = getActiveSlideIndex();
  const activeSlide = document.querySelector(".swiper-slide-active");
  const editor = activeSlide?.querySelector(".editor");

  if (!editor || activeIndex === null) return;

  editor.innerHTML = "";
  if (!slidesTextBlocks[activeIndex]) slidesTextBlocks[activeIndex] = [];

  slidesTextBlocks[activeIndex].forEach((block) => {
    const div = document.createElement("div");
    div.className = "text-block";
    div.contentEditable = true;
    div.style.fontSize = block.fontSize;
    div.style.fontStyle = block.fontStyle;
    div.style.fontFamily = block.fontFamily;
    div.style.color = block.color;
    div.style.fontWeight = block.fontWeight;
    div.style.left = `${block.position.x}px`;
    div.style.top = `${block.position.y}px`;
    div.style.position = "absolute";
    div.innerHTML = block.content;

    div.oninput = () => (block.content = div.innerHTML);

    div.onclick = () => {
      selectedBlock = block; // Set the selected block
      updateStyleControls();
    };

    div.onmousedown = (e) => {
      const shiftX = e.clientX - div.getBoundingClientRect().left;
      const shiftY = e.clientY - div.getBoundingClientRect().top;

      const slide = document.querySelector(".swiper-slide-active");
      const slideRect = slide.getBoundingClientRect();

      function moveAt(pageX, pageY) {
        const newX = Math.max(
          0,
          Math.min(
            pageX - shiftX - slideRect.left,
            slideRect.width - div.offsetWidth
          )
        );
        const newY = Math.max(
          0,
          Math.min(
            pageY - shiftY - slideRect.top,
            slideRect.height - div.offsetHeight
          )
        );
        div.style.left = `${newX}px`;
        div.style.top = `${newY}px`;
      }

      function onMouseMove(e) {
        moveAt(e.pageX, e.pageY);
      }

      document.addEventListener("mousemove", onMouseMove);

      document.addEventListener(
        "mouseup",
        () => {
          document.removeEventListener("mousemove", onMouseMove);
          block.position = {
            x: parseInt(div.style.left),
            y: parseInt(div.style.top),
          };
        },
        { once: true }
      );
    };

    div.ondragstart = () => false;
    editor.appendChild(div);
  });
}

function updateStyleControls() {
  if (selectedBlock) {
    document.getElementById("fontSize").value = selectedBlock.fontSize;
    document.getElementById("fontFamily").value = selectedBlock.fontFamily;
    document.getElementById("color").value = selectedBlock.color;
  }
}

document.getElementById("imageUpload").onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      addNewSlide(event.target.result);
    };
    reader.readAsDataURL(file);
  }
};

document.getElementById("addText").onclick = () => {
  const activeIndex = getActiveSlideIndex();
  if (activeIndex === null) {
    alert("Please upload an image to create a slide first.");
    return;
  }

  saveState();
  const id = Date.now();
  slidesTextBlocks[activeIndex].push({
    id,
    content: "Editable Text",
    fontSize: "20px",
    fontFamily: "Arial",
    color: "white",
    fontStyle: "normal",
    fontWeight: "normal",
    position: { x: 100, y: 100 },
  });
  renderTextBlocks();
};

document.getElementById("undo").onclick = () => {
  const activeIndex = getActiveSlideIndex();
  if (undoStack.length && activeIndex !== null) {
    redoStack.push(JSON.parse(JSON.stringify(slidesTextBlocks[activeIndex])));
    slidesTextBlocks[activeIndex] = undoStack.pop();
    renderTextBlocks();
  }
};

document.getElementById("redo").onclick = () => {
  const activeIndex = getActiveSlideIndex();
  if (redoStack.length && activeIndex !== null) {
    undoStack.push(JSON.parse(JSON.stringify(slidesTextBlocks[activeIndex])));
    slidesTextBlocks[activeIndex] = redoStack.pop();
    renderTextBlocks();
  }
};

document.getElementById("fontSize").onchange = (e) => {
  if (selectedBlock) {
    saveState();
    selectedBlock.fontSize = e.target.value;
    renderTextBlocks();
  }
};

document.getElementById("fontFamily").onchange = (e) => {
  if (selectedBlock) {
    saveState();
    selectedBlock.fontFamily = e.target.value;
    renderTextBlocks();
  }
};

document.getElementById("color").onchange = (e) => {
  if (selectedBlock) {
    saveState();
    selectedBlock.color = e.target.value;
    renderTextBlocks();
  }
};

document.getElementById("bold").onclick = () => {
  if (selectedBlock) {
    saveState();
    selectedBlock.fontWeight =
      selectedBlock.fontWeight === "bold" ? "normal" : "bold";
    renderTextBlocks();
  }
};

document.getElementById("italic").onclick = () => {
  if (selectedBlock) {
    saveState();
    selectedBlock.fontStyle =
      selectedBlock.fontStyle === "italic" ? "normal" : "italic";
    renderTextBlocks();
  }
};
