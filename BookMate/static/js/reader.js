let pdfDoc = null;
let currentPage = 1;
let pageRendering = false;

const canvas = document.getElementById("pdf-viewer");
const ctx = canvas.getContext("2d");
const pageNumberDisplay = document.getElementById("page-number");

// ✅ Book-specific storage key
const bookId = canvas.dataset.bookId || "default-book";
const STORAGE_KEY = `reader-progress-${bookId}`;

// ✅ Restore last saved page
const savedPage = localStorage.getItem(STORAGE_KEY);
if (savedPage) {
  currentPage = parseInt(savedPage);
}



fetch("/api/mock-book/")
  .then(res => res.json())
  .then(data => {
    pdfjsLib.getDocument(data.pdf_url).promise.then(pdf => {
      pdfDoc = pdf;
      renderPage(currentPage);   // ✅ resumes correctly
      loadChapters();  
    });
  });


function renderPage(num) {
  pdfDoc.getPage(num).then((page) => {
    const viewport = page.getViewport({ scale: 1.1 });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    page.render(renderContext);

    pageNumberDisplay.textContent = `Page ${num} / ${pdfDoc.numPages}`;

    // ✅ SAVE PROGRESS
    localStorage.setItem(STORAGE_KEY, num);

    // ✅ SYNC CHAPTER DROPDOWN WITH PAGE
    highlightCurrentChapter(num);
  });
}


function highlightCurrentChapter(currentPage) {
  const select = document.getElementById("chapterSelect");
  const options = select.options;

  let active = "";
  for (let i = 0; i < options.length; i++) {
    const page = parseInt(options[i].value);
    if (page && page <= currentPage) active = options[i].value;
  }

  if (active) select.value = active;
}


function nextPage() {
  if (currentPage >= pdfDoc.numPages) return;
  currentPage++;
  renderPage(currentPage);
}



function prevPage() {
  if (currentPage <= 1) return;
  currentPage--;
  renderPage(currentPage);
}



function loadChapters() {
  const select = document.getElementById("chapterSelect");

  pdfDoc.getOutline().then(outline => {
    select.innerHTML = '<option value="">Go to Chapter</option>';

    if (!outline || outline.length === 0) {
      const opt = document.createElement("option");
      opt.textContent = "No chapters detected";
      opt.disabled = true;
      select.appendChild(opt);
      return;
    }

    outline.forEach((chapter, index) => {
      if (!chapter.dest) return;

      pdfDoc.getPageIndex(chapter.dest[0]).then(pageIndex => {
        const option = document.createElement("option");
        option.value = pageIndex + 1; // ✅ actual page number
        option.textContent = chapter.title || `Chapter ${index + 1}`;
        select.appendChild(option);
      });
    });
  });

  select.onchange = function () {
    if (this.value) {
      currentPage = parseInt(this.value);
      renderPage(currentPage);
    }
  };
}

