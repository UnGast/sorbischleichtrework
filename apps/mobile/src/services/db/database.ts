import { Topic, VocabItem, PhraseItem, HundredSecItem } from '@/types/content';

interface ContentData {
  topics: Topic[];
  vocabularyByTopic: Record<string, VocabItem[]>;
  phrasesByTopic: Record<string, PhraseItem[]>;
  hundredSeconds: HundredSecItem[];
}

class DatabaseService {
  private initialized = false;
  private contentData: ContentData | null = null;

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // For now, the content will be loaded by contentService
    // In production, this would initialize SQLite database
    this.contentData = {
      topics: [],
      vocabularyByTopic: {},
      phrasesByTopic: {},
      hundredSeconds: [],
    };

    this.initialized = true;
  }

  private ensureInitialized() {
    if (!this.initialized) {
      throw new Error('databaseService.init() must be called before using database methods.');
    }
  }

  async getTopics(_packId: string): Promise<Topic[]> {
    this.ensureInitialized();
    return this.contentData?.topics ?? [];
  }

  async getVocabularyGroup(_packId: string): Promise<Record<string, VocabItem[]>> {
    this.ensureInitialized();
    return this.contentData?.vocabularyByTopic ?? {};
  }

  async getPhrasesGroup(_packId: string): Promise<Record<string, PhraseItem[]>> {
    this.ensureInitialized();
    return this.contentData?.phrasesByTopic ?? {};
  }

  async getHundredSeconds(_packId: string): Promise<HundredSecItem[]> {
    this.ensureInitialized();
    return this.contentData?.hundredSeconds ?? [];
  }

  // Method to set content data (used by contentService for dev mode)
  setContentData(data: ContentData) {
    this.contentData = data;
  }
}

export const databaseService = new DatabaseService();

