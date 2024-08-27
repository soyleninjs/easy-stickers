function openDatabase() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open("EasyStickers");

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      db.createObjectStore("stickers", { keyPath: "id" });
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error("Error al abrir IndexedDB:", event.target.errorCode);
      reject(event.target.errorCode);
    };
  });
}

function addSticker(name, content) {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then((db) => {
        let transaction = db.transaction(["stickers"], "readwrite");
        let objectStore = transaction.objectStore("stickers");
        let request = objectStore.add({ 
          id: crypto.randomUUID(),
          create_at: new Date().toISOString(),
          name, 
          content,
        });

        request.onsuccess = function () {
          console.log("Sticker añadido con éxito");
          resolve("Sticker añadido con éxito")
        };

        request.onerror = function (event) {
          console.error("Error al añadir el sticker:", event.target.errorCode);
          reject("Error al añadir el sticker");
        };
      })
      .catch((error) => {
        console.error("No se pudo obtener IndexedDB:", error);
      });
  })
}

function updateSticker(sticker) {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then((db) => {
        const transaction = db.transaction(["stickers"], "readwrite");
        const objectStore = transaction.objectStore("stickers");
        const request = objectStore.put({
          ...sticker,
          last_copied: new Date().getTime(),
        });

        request.onsuccess = () => {
          console.log("Sticker actualizado con éxito");
          resolve("Sticker actualizado con éxito");
        };

        request.onerror = (event) => {
          console.error("Error al actualizar el sticker:", event.target.errorCode);
          reject("Error al actualizar el sticker");
        };
      })
      .catch((error) => {
        console.error("No se pudo obtener IndexedDB:", error);
      });
  })
}

function removeSticker(sticker) {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then((db) => {
        const transaction = db.transaction(["stickers"], "readwrite");
        const objectStore = transaction.objectStore("stickers");
        const request = objectStore.delete(sticker.id);

        request.onsuccess = () => {
          resolve("Sticker se removio con éxito");
        };

        request.onerror = (event) => {
          reject("Error al remover el sticker:", event.target.errorCode);
        };
      })
      .catch((error) => {
        reject("No se pudo obtener IndexedDB:", error);
      });
  })
}

function getAllStickers() {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then((db) => {
        let transaction = db.transaction(["stickers"], "readonly");
        let objectStore = transaction.objectStore("stickers");
        let request = objectStore.getAll();

        request.onsuccess = function (event) {
          resolve(event.target.result);
        };

        request.onerror = function (event) {
          console.error("Error al recuperar stickers:", event.target.errorCode);
          reject("Error al recuperar stickers")
        };
      })
      .catch((error) => {
        console.error("No se pudo obtener IndexedDB:", error);
      });
  })
}