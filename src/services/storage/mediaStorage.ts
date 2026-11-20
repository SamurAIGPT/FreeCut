import { IndexedDBAdapter } from './IndexedDBAdapter';

export interface StoredMediaBlob {
  id: string; // asset id
  name: string;
  type: string; // mimeType (e.g. 'image/jpeg', 'video/webm')
  blob: Blob;
  dataUrl?: string; // For images, base64 data url for permanent persistence
}

class MediaStorageService {
  private adapter: IndexedDBAdapter<StoredMediaBlob>;

  constructor() {
    this.adapter = new IndexedDBAdapter<StoredMediaBlob>({
      dbName: 'freecut-media-storage',
      storeName: 'media-blobs',
      version: 1,
    });
  }

  async saveMedia(id: string, name: string, type: string, blob: Blob, dataUrl?: string): Promise<string> {
    try {
      await this.adapter.set(id, { id, name, type, blob, dataUrl });
      return dataUrl || URL.createObjectURL(blob);
    } catch (err) {
      console.warn('Failed to save media blob to IndexedDB:', err);
      return dataUrl || URL.createObjectURL(blob);
    }
  }

  async getMediaUrl(id: string): Promise<string | null> {
    try {
      const item = await this.adapter.get(id);
      if (!item) return null;
      if (item.dataUrl) return item.dataUrl;
      if (item.blob) {
        return URL.createObjectURL(item.blob);
      }
    } catch (err) {
      console.warn(`Failed to retrieve media blob for ${id}:`, err);
    }
    return null;
  }

  async removeMedia(id: string): Promise<void> {
    try {
      await this.adapter.remove(id);
    } catch {
      // ignore
    }
  }
}

export const mediaStorage = new MediaStorageService();
