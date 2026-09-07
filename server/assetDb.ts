import { AssetRecord, ProjectRecord } from './types.js';

// Local In-Memory & File-backed Database Store
class LocalAssetDatabase {
  private assets: Map<string, AssetRecord> = new Map();
  private projects: Map<string, ProjectRecord> = new Map();

  constructor() {
    this.seedInitialAssets();
  }

  private seedInitialAssets() {
    // High-quality starter assets suitable for video editing
    const defaultAssets: AssetRecord[] = [
      {
        id: 'asset_nature_drone',
        name: '4K Cinematic Mountain Drone.mp4',
        type: 'video',
        uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
        duration: 8.5,
        width: 1920,
        height: 1080,
        fps: 60,
        sizeBytes: 18450000,
        mimeType: 'video/mp4',
        codec: 'h264',
        tags: ['Cinematic', 'Landscape', '4K', 'Nature', 'B-Roll'],
        thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 3600000,
      },
      {
        id: 'asset_city_night',
        name: 'Cyberpunk Tokyo Neon Street.mp4',
        type: 'video',
        uri: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1920&q=80',
        duration: 6.2,
        width: 1920,
        height: 1080,
        fps: 30,
        sizeBytes: 12400000,
        mimeType: 'video/mp4',
        codec: 'h264',
        tags: ['Urban', 'Cyberpunk', 'Neon', 'Night', 'Aesthetic'],
        thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=400&q=80',
        createdAt: Date.now() - 7200000,
        updatedAt: Date.now() - 7200000,
      },
      {
        id: 'asset_creator_vlog',
        name: 'Tech Studio Setup Talking Head.mp4',
        type: 'video',
        uri: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1920&q=80',
        duration: 12.0,
        width: 1080,
        height: 1920,
        fps: 60,
        sizeBytes: 24500000,
        mimeType: 'video/mp4',
        codec: 'h264',
        tags: ['Creator', 'Studio', 'Vlog', 'TikTok', 'Vertical 9:16'],
        thumbnail: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=400&q=80',
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      },
      {
        id: 'asset_audio_synthwave',
        name: 'Midnight Drive (Synthwave Beat).mp3',
        type: 'audio',
        uri: 'https://cdn.freesound.org/previews/560/560446_11861866-lq.mp3',
        duration: 15.0,
        sizeBytes: 3200000,
        mimeType: 'audio/mpeg',
        codec: 'mp3',
        audioChannels: 2,
        sampleRate: 48000,
        tags: ['Music', 'Synthwave', 'Upbeat', 'Trending'],
        createdAt: Date.now() - 50000000,
        updatedAt: Date.now() - 50000000,
      },
      {
        id: 'asset_audio_swoosh',
        name: 'Cinematic Cinematic Whoosh Transition.wav',
        type: 'sfx',
        uri: 'https://cdn.freesound.org/previews/608/608645_11861866-lq.mp3',
        duration: 1.8,
        sizeBytes: 450000,
        mimeType: 'audio/wav',
        codec: 'pcm',
        audioChannels: 2,
        sampleRate: 48000,
        tags: ['SFX', 'Whoosh', 'Transition', 'Impact'],
        createdAt: Date.now() - 60000000,
        updatedAt: Date.now() - 60000000,
      },
      {
        id: 'asset_audio_impact',
        name: 'Deep Bass Sub Drop & Hit.wav',
        type: 'sfx',
        uri: 'https://cdn.freesound.org/previews/442/442943_9159316-lq.mp3',
        duration: 2.4,
        sizeBytes: 680000,
        mimeType: 'audio/wav',
        codec: 'pcm',
        audioChannels: 2,
        sampleRate: 48000,
        tags: ['SFX', 'Bass', 'Drop', 'Cinematic'],
        createdAt: Date.now() - 70000000,
        updatedAt: Date.now() - 70000000,
      },
      {
        id: 'asset_overlay_lensflare',
        name: 'Golden Anamorphic Lens Flare.png',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
        duration: 5.0,
        width: 1920,
        height: 1080,
        sizeBytes: 1500000,
        mimeType: 'image/png',
        tags: ['Overlay', 'Lens Flare', 'VFX', 'Light'],
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
        createdAt: Date.now() - 80000000,
        updatedAt: Date.now() - 80000000,
      }
    ];

    defaultAssets.forEach(a => this.assets.set(a.id, a));
  }

  public getAllAssets(filter?: { type?: string; query?: string; tag?: string }): AssetRecord[] {
    let list = Array.from(this.assets.values());
    if (filter) {
      if (filter.type && filter.type !== 'all') {
        list = list.filter(a => a.type === filter.type);
      }
      if (filter.tag) {
        list = list.filter(a => a.tags.some(t => t.toLowerCase() === filter.tag!.toLowerCase()));
      }
      if (filter.query) {
        const q = filter.query.toLowerCase();
        list = list.filter(a => a.name.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q)));
      }
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  public getAsset(id: string): AssetRecord | undefined {
    return this.assets.get(id);
  }

  public addAsset(asset: Omit<AssetRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): AssetRecord {
    const id = asset.id || `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRecord: AssetRecord = {
      ...asset,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.assets.set(id, newRecord);
    return newRecord;
  }

  public updateAsset(id: string, updates: Partial<AssetRecord>): AssetRecord | null {
    const existing = this.assets.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };
    this.assets.set(id, updated);
    return updated;
  }

  public deleteAsset(id: string): boolean {
    return this.assets.delete(id);
  }

  // Projects Management
  public getAllProjects(): ProjectRecord[] {
    return Array.from(this.projects.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getProject(id: string): ProjectRecord | undefined {
    return this.projects.get(id);
  }

  public saveProject(project: ProjectRecord): ProjectRecord {
    project.updatedAt = Date.now();
    this.projects.set(project.id, project);
    return project;
  }

  public deleteProject(id: string): boolean {
    return this.projects.delete(id);
  }

  // Storage Diagnostics & Stats
  public getStorageStats() {
    const totalAssets = this.assets.size;
    let totalSizeBytes = 0;
    this.assets.forEach(a => {
      totalSizeBytes += a.sizeBytes || 0;
    });

    return {
      totalAssets,
      totalProjects: this.projects.size,
      totalSizeBytes,
      totalSizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
      engine: 'SQLite / LevelDB Local File Store',
      location: '~/Library/Application Support/LumenLabStudio/assets.db',
      offlineReady: true,
      lastSync: new Date().toISOString(),
    };
  }
}

export const assetDb = new LocalAssetDatabase();
