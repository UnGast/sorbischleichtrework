import { ContentTopic, VocabularyItem, PhraseItem } from '@/types/content';

export const mockTopics: ContentTopic[] = [
  {
    id: 'vocab-01',
    type: 'vocabulary',
    nameGerman: 'Begrüßung und Verabschiedung',
    nameSorbian: 'Postrowjenje a rozžohnowanje',
    icon: 'lektion1.png',
  },
  {
    id: 'phrases-01',
    type: 'phrases',
    nameGerman: 'Alltagssätze',
    nameSorbian: 'Wšědne sady',
  },
];

export const mockVocabulary: Record<string, VocabularyItem[]> = {
  'vocab-01': [
    {
      id: 'voc-01-01',
      topicId: 'vocab-01',
      textGerman: 'Guten Morgen!',
      textSorbian: 'Dobre ranje!',
      image: 'Fotolia_46575927_S.jpg',
      audioSorbian: 'voc_snd_01_01s.mp3',
    },
    {
      id: 'voc-01-02',
      topicId: 'vocab-01',
      textGerman: 'Guten Tag!',
      textSorbian: 'Dobry dźeń!',
      image: 'Fotolia_35730691_S.jpg',
      audioSorbian: 'voc_snd_01_02s.mp3',
    },
  ],
};

export const mockPhrases: Record<string, PhraseItem[]> = {
  'phrases-01': [
    {
      id: 'phr-01-01',
      topicId: 'phrases-01',
      germanText: 'Wie geht es dir?',
      sorbianText: 'Kak so maš?',
      germanAudio: 'phr_01_01_de.mp3',
      sorbianAudio: 'phr_01_01_sb.mp3',
    },
    {
      id: 'phr-01-02',
      topicId: 'phrases-01',
      germanText: 'Mir geht es gut.',
      sorbianText: 'Mě so dobre dari.',
      germanAudio: 'phr_01_02_de.mp3',
      sorbianAudio: 'phr_01_02_sb.mp3',
    },
  ],
};
