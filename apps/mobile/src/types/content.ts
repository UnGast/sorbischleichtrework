export type TopicType = 'vocabulary' | 'phrases' | 'hundredSeconds';

export interface Topic {
  id: string;
  type: TopicType;
  nameGerman: string;
  nameSorbian: string;
  icon?: string;
  audioIntroSorbian?: string;
  order: number;
}

export interface VocabItem {
  id: string;
  topicId: string;
  textGerman: string;
  textSorbian: string;
  img?: string;
  audioSorbian?: string;
  ignoreAssign?: boolean;
  ignoreWrite?: boolean;
}

export interface PhraseItem {
  id: string;
  topicId: string;
  germanText: string;
  sorbianText: string;
  germanAudio?: string;
  sorbianAudio?: string;
  type?: 'normal' | 'separator';
  infoText?: string;
}

export interface HundredSecItem {
  id: string;
  name: string;
  audio: string;
  image?: string;
}

export type EntityType = 'vocab' | 'phrase' | 'topic' | 'hundred';

export interface ProgressEntry {
  entityId: string;
  entityType: EntityType;
  attempts: number;
  correct: number;
  lastSeenAt: number;
}

export interface ModuleAvailability {
  vocabulary: boolean;
  phrases: boolean;
  hundredSeconds: boolean;
}
