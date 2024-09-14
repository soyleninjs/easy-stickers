// Utils
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const htmlStringToNode = (htmlString) => new window.DOMParser().parseFromString(htmlString, "text/html").body.firstElementChild;

// Elments
const toastNotifications = $("toast-notifications");
const $buttonExport = $('[data-button-export]');
const allStickersContainer = $("[data-all-stickers-grid]");
const lastCopiedContainer = $("[data-last-copied-stickers-grid]");

// Configs
const proccessFile = (file) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    toastNotifications.createToast(`La imagen cargada es de tipo ${file.type.split("/")[1].toUpperCase()} <br> Solo se permiten imágenes estáticas (JPEG, PNG, WEBP).`, "error");
    return;
  }

  // Procesar la imagen si es un tipo permitido
  const reader = new FileReader();
  reader.onload = async () => {
    let base64 = reader.result;
    const message = await addSticker(file.name, base64);
    showStickers();
    toastNotifications.createToast(message, "success");
  };
  reader.readAsDataURL(file); // Leer la imagen como base64
};

const proccessFiles = (files) => {
  if (files && files.length > 0) {
    Array.from(files).forEach((file) => {
      proccessFile(file);
    });
  }
};

const configInputFile = () => {
  const $input = $("#fileInput");
  $input.addEventListener("change", function (event) {
    let { files } = event.target;
    proccessFiles(files);
  });

  return $input;
};

const configDragAndDrop = () => {
  const $body = document.body;
  const classDrag = "files-for-drop";

  const handleDrop = (event) => {
    event.preventDefault();
    let { files } = event.dataTransfer;
    proccessFiles(files);
    $body.classList.remove(classDrag);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    $body.classList.add(classDrag);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    if (!event.relatedTarget || !event.relatedTarget.closest("body")) {
      $body.classList.remove(classDrag);
    }
  };

  $body.addEventListener("drop", handleDrop);
  $body.addEventListener("dragover", handleDragOver);
  $body.addEventListener("dragleave", handleDragLeave);
};

const configCopySize = () => {
  const $radioSizes = $$('input[name="size-image"]')
  const value = $('input[name="size-image"]:checked').value
  const defaultSize = localStorage.getItem("copy-size")

  if (defaultSize === null) {
    localStorage.setItem("copy-size", value)
  } else {
    $(`input[value="${defaultSize}"]`).checked = true
  }

  $radioSizes.forEach($radio => {
    $radio.addEventListener("click", () => {
      localStorage.setItem("copy-size", $radio.value)
    })
  })
}

const exportStickersZip = () => {
  const zip = new JSZip();
  $buttonExport.classList.add("loading")

  // Accede a los stickers almacenados en IndexedDB
  getAllStickers().then(stickers => {
    if (stickers.length === 0) {
      window.alert('No hay stickers para exportar.');
      return;
    }

    stickers.forEach((sticker, index) => {
        const base64Data = sticker.content.split(',')[1]; // Elimina el encabezado 'data:image/*;base64,'
        
        // Detecta el tipo de imagen para agregar la extensión correcta
        let extension = '';
        if (sticker.content.startsWith('data:image/png')) {
            extension = 'png';
        } else if (sticker.content.startsWith('data:image/jpeg')) {
            extension = 'jpg';
        } else if (sticker.content.startsWith('data:image/webp')) {
            extension = 'webp';
        } else {
            console.error('Formato de imagen no soportado:', sticker.content);
            return;
        }

        // Agrega el archivo al zip
        zip.file(`sticker-${index + 1}.${extension}`, base64Data, { base64: true });
    });

    // // Genera el archivo ZIP y permite descargarlo
    zip.generateAsync({ type: "blob" })
      .then(function (blob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "stickers.zip";
        link.click();
        toastNotifications.createToast("Zip generado correctamente", "success");
      })
      .catch(function (error) {
        toastNotifications.createToast("Error al generar el ZIP", "error");
      })
      .finally(() => {
        $buttonExport.classList.remove("loading")
      })
  });
}

// Renders
const getOrdenedStickersByDate = (stickers) => {
  return Array.from(stickers).sort((a, b) => new Date(b.create_at) - new Date(a.create_at));
};

const getOrdenedStickersByLastCopied = (stickers) => {
  const orderStickers = Array.from(stickers).sort((a, b) => (b.last_copied || 0) - (a.last_copied || 0));
  const lastCopiedStickers = orderStickers.filter((obj) => obj.last_copied !== undefined);
  return lastCopiedStickers.slice(0, 10);
};

const handleEventsSticker = (stickerData, $stickerElement) => {
  $stickerElement.addEventListener("click", async () => {
    copyImageToClipboard(stickerData.content);
    await updateSticker(stickerData);
    showStickers();
  });

  $stickerElement.querySelector("[data-button-delete]").addEventListener("click", async (event) => {
    event.stopPropagation();
    const deleteElement = confirm("¿Estás seguro de que quieres eliminar este elemento?");

    if (deleteElement) {
      const message = await removeSticker(stickerData);
      showStickers();
      toastNotifications.createToast(message, "success");
    } else {
      toastNotifications.createToast("Eliminación cancelada.", "error");
    }
  });
}

const renderStickers = (stickers, $container) => {
  $container.innerHTML = ""; // Limpiar el grid

  stickers.forEach((stickerData) => {
    const $stickerElementString = `
      <div class="easy-stickers-item">
        <div class="easy-stickers-image-wrapper">
          <img draggable="false" class="easy-stickers-image" src="${stickerData.content}" alt="${stickerData.name}"/>
        </div>
        <button class="easy-stickers-image-delete" type="button" data-button-delete>
          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M5.75 3V1.5h4.5V3h-4.5Zm-1.5 0V1a1 1 0 0 1 1-1h5.5a1 1 0 0 1 1 1v2h2.5a.75.75 0 0 1 0 1.5h-.365l-.743 9.653A2 2 0 0 1 11.148 16H4.852a2 2 0 0 1-1.994-1.847L2.115 4.5H1.75a.75.75 0 0 1 0-1.5h2.5Zm-.63 1.5h8.76l-.734 9.538a.5.5 0 0 1-.498.462H4.852a.5.5 0 0 1-.498-.462L3.62 4.5Z" clip-rule="evenodd"/></svg>
        </button>
      </div>
    `;

    const $stickerElement = htmlStringToNode($stickerElementString);
    handleEventsSticker(stickerData, $stickerElement)

    $container.append($stickerElement);
  });
};

async function showStickers() {
  const stickers = await getAllStickers();
  document.body.classList.remove("no-stickers")
  const orderStickersByDate = getOrdenedStickersByDate(stickers);
  const ordenedStickersByLastCopied = getOrdenedStickersByLastCopied(stickers);
  renderStickers(orderStickersByDate, allStickersContainer);
  renderStickers(ordenedStickersByLastCopied, lastCopiedContainer);
  
  if (stickers.length === 0) {
    document.body.classList.add("no-stickers")
  }
}

function copyImageToClipboard(dataUrl) {
  const maxWidth = Number($('input[name="size-image"]:checked').value)
  let img = new Image();
  img.src = dataUrl;
  img.onload = function () {
    // Calcular el nuevo tamaño manteniendo el aspect ratio
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      const aspectRatio = height / width;
      width = maxWidth;
      height = maxWidth * aspectRatio;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(function (blob) {
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard
        .write([item])
        .then(function () {
          toastNotifications.createToast("Imagen copiada al portapapeles", "success");
        })
        .catch(function (error) {
          toastNotifications.createToast("Error al copiar sticker", "error");
          console.error("Error al copiar sticker:", error);
        });
    });
  };
}

// Mostrar las imágenes al cargar la extensión
document.addEventListener("DOMContentLoaded", () => {
  configCopySize()
  configInputFile();
  configDragAndDrop();
  showStickers();

  $buttonExport.addEventListener('click', exportStickersZip);
});
