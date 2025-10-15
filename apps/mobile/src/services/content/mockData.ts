import { Topic, VocabItem, PhraseItem, HundredSecItem } from '@/types/content';

export const mockTopics: Topic[] = [
  {
    id: 'vocab-01',
    type: 'vocabulary',
    nameGerman: 'Begrüßung und Verabschiedung',
    nameSorbian: 'Postrowjenje a rozžohnowanje',
    icon: 'lektion1.png',
    order: 1,
  },
  {
    id: 'phrases-01',
    type: 'phrases',
    nameGerman: 'Alltagssätze',
    nameSorbian: 'Wšědne sady',
    order: 2,
  },
  {
    id: 'hundred-01',
    type: 'hundredSeconds',
    nameGerman: 'Sorbisch in 100 Sekunden',
    nameSorbian: 'Serbsce za 100 sekundow',
    order: 3,
  },
];

export const mockVocabulary: Record<string, VocabItem[]> = {
  'vocab-01': [
    {
      id: 'voc-01-01',
      topicId: 'vocab-01',
      textGerman: 'Guten Morgen!',
      textSorbian: 'Dobre ranje!',
      img: 'Fotolia_46575927_S.jpg',
      audioSorbian: 'audio/mock.mp3',
    },
    {
      id: 'voc-01-02',
      topicId: 'vocab-01',
      textGerman: 'Guten Tag!',
      textSorbian: 'Dobry dźeń!',
      img: 'Fotolia_35730691_S.jpg',
      audioSorbian: 'audio/mock.mp3',
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
      germanAudio: 'audio/mock.mp3',
      sorbianAudio: 'audio/mock.mp3',
    },
    {
      id: 'phr-01-02',
      topicId: 'phrases-01',
      germanText: 'Mir geht es gut.',
      sorbianText: 'Mě so dobre dari.',
      germanAudio: 'audio/mock.mp3',
      sorbianAudio: 'audio/mock.mp3',
    },
  ],
};

export const mockHundredSeconds: HundredSecItem[] = [
  { id: 'hund-01', name: 'Begrüßung', audio: 'audio/mock.mp3' },
  { id: 'hund-02', name: 'Verabschiedung', audio: 'audio/mock.mp3' },
  { id: 'hund-03', name: 'Nett sein', audio: 'audio/mock.mp3' },
  { id: 'hund-04', name: 'Kiosk', audio: 'audio/mock.mp3' },
  { id: 'hund-05', name: 'Liebe', audio: 'audio/mock.mp3' },
];
