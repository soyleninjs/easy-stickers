function openDatabase() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open("EasyStickers");

    request.onupgradeneeded = function (event) {
      db = event.target.result;
      db.createObjectStore("stickers", { keyPath: "id" });
    };

    request.onsuccess = function (event) {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = function (event) {
      console.error("Error al abrir IndexedDB:", event.target.errorCode);
      reject(event.target.errorCode);
    };
  });
}

function addSticker(name, content) {
  openDatabase()
    .then((db) => {
      let transaction = db.transaction(["stickers"], "readwrite");
      let objectStore = transaction.objectStore("stickers");
      let sticker = {
        id: crypto.randomUUID(),
        create_at: new Date().toISOString(),
        name,
        content,
      };

      let request = objectStore.add(sticker);

      request.onsuccess = function () {
        console.log("Sticker añadido con éxito");
      };

      request.onerror = function (event) {
        console.error("Error al añadir el sticker:", event.target.errorCode);
        reject(event.target.errorCode);
      };
    })
    .catch((error) => {
      console.error("No se pudo inicializar IndexedDB:", error);
    });
}

async function convertImageToBase64(imageUrl) {
  // Fetch the image from the URL
  const response = await fetch(imageUrl);
  // Convert the image to a blob
  const blob = await response.blob();
  // Create a FileReader to read the blob as Base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result); // This will be the Base64 encoded string
    };
    reader.onerror = () => {
      reject("Error reading file");
    };
    reader.readAsDataURL(blob); // Read the blob as Data URL (Base64)
  });
}

// ---------------------
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    title: "Add image to Easy Stickers",
    contexts: ["image"],
    id: "easy-stickers-image",
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.srcUrl.includes("http")) {
    convertImageToBase64(info.srcUrl).then((base64) => {
      addSticker("image", base64);
    });
  } else {
    addSticker("image", info.srcUrl);
  }
});
