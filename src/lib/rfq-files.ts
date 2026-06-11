import type { RfqAttachment } from "@/lib/store";

const DB_NAME = "nexforge-rfq-files";
const DB_VERSION = 1;
const STORE_NAME = "files";

type StoredAttachmentFile = {
  id: string;
  rfqId: string;
  attachmentId: string;
  name: string;
  type: string;
  blob: Blob;
  createdAt: string;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export async function saveRfqFiles(rfqId: string, attachments: RfqAttachment[], files: File[]) {
  await Promise.all(
    attachments.map((attachment, index) => {
      const file = files[index];
      if (!file || !attachment.storageKey) return Promise.resolve();
      const record: StoredAttachmentFile = {
        id: attachment.storageKey,
        rfqId,
        attachmentId: attachment.id,
        name: attachment.name,
        type: attachment.type,
        blob: file,
        createdAt: new Date().toISOString(),
      };
      return withStore("readwrite", (store) => store.put(record));
    }),
  );
}

async function getStoredFile(storageKey: string) {
  return withStore<StoredAttachmentFile | undefined>("readonly", (store) => store.get(storageKey));
}

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let j = 0; j < 8; j += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
}

const crcTable = makeCrcTable();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function sanitizeZipName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim() || "arquivo";
}

async function createZip(entries: Array<{ name: string; blob: Blob }>) {
  const encoder = new TextEncoder();
  const chunks: BlobPart[] = [];
  const centralDirectory: number[] = [];
  let offset = 0;

  for (const entry of entries) {
    const data = new Uint8Array(await entry.blob.arrayBuffer());
    const fileName = encoder.encode(sanitizeZipName(entry.name));
    const checksum = crc32(data);
    const localHeader: number[] = [];

    writeUint32(localHeader, 0x04034b50);
    writeUint16(localHeader, 20);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint32(localHeader, checksum);
    writeUint32(localHeader, data.length);
    writeUint32(localHeader, data.length);
    writeUint16(localHeader, fileName.length);
    writeUint16(localHeader, 0);

    chunks.push(new Uint8Array(localHeader), fileName, data);

    writeUint32(centralDirectory, 0x02014b50);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, checksum);
    writeUint32(centralDirectory, data.length);
    writeUint32(centralDirectory, data.length);
    writeUint16(centralDirectory, fileName.length);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, 0);
    writeUint32(centralDirectory, offset);
    centralDirectory.push(...fileName);

    offset += localHeader.length + fileName.length + data.length;
  }

  const centralOffset = offset;
  const centralBytes = new Uint8Array(centralDirectory);
  const endHeader: number[] = [];
  writeUint32(endHeader, 0x06054b50);
  writeUint16(endHeader, 0);
  writeUint16(endHeader, 0);
  writeUint16(endHeader, entries.length);
  writeUint16(endHeader, entries.length);
  writeUint32(endHeader, centralBytes.length);
  writeUint32(endHeader, centralOffset);
  writeUint16(endHeader, 0);

  chunks.push(centralBytes, new Uint8Array(endHeader));
  return new Blob(chunks, { type: "application/zip" });
}

export async function downloadRfqAttachmentsZip(rfqId: string, attachments: RfqAttachment[]) {
  const records = await Promise.all(
    attachments.map(async (attachment) => {
      if (!attachment.storageKey) return null;
      const stored = await getStoredFile(attachment.storageKey);
      return stored ? { name: stored.name || attachment.name, blob: stored.blob } : null;
    }),
  );
  const entries = records.filter(Boolean) as Array<{ name: string; blob: Blob }>;
  if (!entries.length) throw new Error("Nenhum arquivo local encontrado para download.");

  const zip = await createZip(entries);
  const url = URL.createObjectURL(zip);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${rfqId}-arquivos-tecnicos.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
