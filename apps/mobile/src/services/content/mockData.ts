import { ContentTopic, VocabularyItem, PhraseItem, HundredSecondsItem } from '@/types/content';

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
  {
    id: 'hundred-01',
    type: 'hundredSeconds',
    nameGerman: 'Sorbisch in 100 Sekunden',
    nameSorbian: 'Serbsce za 100 sekundow',
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

export const mockHundredSeconds: HundredSecondsItem[] = [
  { id: 'hund-01', name: 'Begrüßung', audio: 'hundredsec1.mp3' },
  { id: 'hund-02', name: 'Verabschiedung', audio: 'hundredsec2.mp3' },
  { id: 'hund-03', name: 'Nett sein', audio: 'hundredsec3.mp3' },
  { id: 'hund-04', name: 'Kiosk', audio: 'hundredsec4.mp3' },
  { id: 'hund-05', name: 'Liebe', audio: 'hundredsec5.mp3' },
];
