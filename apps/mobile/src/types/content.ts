export type TopicType = 'vocabulary' | 'phrases' | 'hundredSeconds';

export interface ContentTopic {
  id: string;
  type: TopicType;
  nameGerman: string;
  nameSorbian: string;
  icon?: string;
  description?: string;
}

export interface VocabularyItem {
  id: string;
  topicId: string;
  textGerman: string;
  textSorbian: string;
  image?: string;
  audioSorbian?: string;
}

export interface PhraseItem {
  id: string;
  topicId: string;
  germanText: string;
  sorbianText: string;
  germanAudio?: string;
  sorbianAudio?: string;
}
