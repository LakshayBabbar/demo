const slidesTextBlocks = {};
const undoStack = [];
const redoStack = [];
let selectedBlock = null;

const settings = document.getElementById("settings");

function getActiveSlideIndex() {
  const activeSlide = document.querySelector(".swiper-slide-active");
  return activeSlide ? activeSlide.dataset.swiperSlideIndex : "0";
}

function saveState() {
  const activeIndex = getActiveSlideIndex();
  if (!slidesTextBlocks[activeIndex]) slidesTextBlocks[activeIndex] = [];
  undoStack.push(JSON.parse(JSON.stringify(slidesTextBlocks[activeIndex])));
  redoStack.length = 0;
}

function addTextBlock() {
  saveState();
  const id = Date.now();
  const activeIndex = getActiveSlideIndex();

  if (!slidesTextBlocks[activeIndex]) slidesTextBlocks[activeIndex] = [];
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
}

function delTextBlock(id) {
  const activeIndex = getActiveSlideIndex();
  undoStack.push(JSON.parse(JSON.stringify(slidesTextBlocks[activeIndex])));
  slidesTextBlocks[activeIndex] = slidesTextBlocks[activeIndex].filter(
    (block) => block.id != id
  );
  renderTextBlocks();
}

function renderTextBlocks() {
  const activeIndex = getActiveSlideIndex();
  const activeSlide = document.querySelector(".swiper-slide-active");
  const editor = activeSlide?.querySelector(".editor");

  if (!editor) return;

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
    div.innerHTML = `
      <p>${block.content}</p>
      <button onclick="delTextBlock(${block.id})" class='delBlock'>Del</button>
      `;

    div.onblur = () => (block.content = div.innerText);

    div.onmousedown = (e) => {
      selectedBlock = block;
      settings.style.display = "flex";

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

document.getElementById("addText").onclick = addTextBlock;

document.getElementById("undo").onclick = () => {
  const activeIndex = getActiveSlideIndex();
  if (undoStack.length && slidesTextBlocks[activeIndex]) {
    redoStack.push([...slidesTextBlocks[activeIndex]]);
    slidesTextBlocks[activeIndex].length = 0;
    slidesTextBlocks[activeIndex].push(...undoStack.pop());
    renderTextBlocks();
  }
};

document.getElementById("redo").onclick = () => {
  const activeIndex = getActiveSlideIndex();
  if (redoStack.length && slidesTextBlocks[activeIndex]) {
    undoStack.push([...slidesTextBlocks[activeIndex]]);
    slidesTextBlocks[activeIndex].length = 0;
    slidesTextBlocks[activeIndex].push(...redoStack.pop());
    renderTextBlocks();
  }
};

document.getElementById("fontSize").onchange = (e) => {
  const activeIndex = getActiveSlideIndex();
  if (selectedBlock) {
    selectedBlock.fontSize = e.target.value;
    undoStack.push(JSON.parse(JSON.stringify(slidesTextBlocks[activeIndex])));
    renderTextBlocks();
  }
};

document.getElementById("fontFamily").onchange = (e) => {
  const activeIndex = getActiveSlideIndex();
  if (selectedBlock) {
    selectedBlock.fontFamily = e.target.value;
    undoStack.push(JSON.parse(JSON.stringify(slidesTextBlocks[activeIndex])));
    renderTextBlocks();
  }
};

document.getElementById("color").onchange = (e) => {
  const activeIndex = getActiveSlideIndex();
  if (selectedBlock) {
    selectedBlock.color = e.target.value;
    undoStack.push(JSON.parse(JSON.stringify(slidesTextBlocks[activeIndex])));
    renderTextBlocks();
  }
};

document.getElementById("bold").onclick = () => {
  const activeIndex = getActiveSlideIndex();
  if (selectedBlock) {
    selectedBlock.fontWeight =
      selectedBlock.fontWeight === "bold" ? "normal" : "bold";
    undoStack.push(JSON.parse(JSON.stringify(slidesTextBlocks[activeIndex])));
    renderTextBlocks();
  }
};

document.getElementById("italic").onclick = () => {
  const activeIndex = getActiveSlideIndex();
  if (selectedBlock) {
    selectedBlock.fontStyle =
      selectedBlock.fontStyle === "italic" ? "normal" : "italic";
    undoStack.push(JSON.parse(JSON.stringify(slidesTextBlocks[activeIndex])));
    renderTextBlocks();
  }
};

const swiper = new Swiper(".swiper", {
  slidesPerView: 1,
  spaceBetween: 10,
  pagination: { el: ".swiper-pagination", clickable: true },
  on: {
    slideChange: () => {
      renderTextBlocks();
    },
  },
  allowTouchMove: false,
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
});
