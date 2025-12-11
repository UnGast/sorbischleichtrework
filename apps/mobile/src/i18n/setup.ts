import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const DEFAULT_LANGUAGE = 'de';

const resources = {
  de: {
    translation: {
      // Tab navigation
      'tabs.phrases': 'Redewendungen',
      'tabs.learn': 'Übungen',
      'tabs.hundred': '100 Sekunden',
      'tabs.about': 'Über',
      
      // Phrases
      'phrases.title': 'Übersicht',
      'phrases.unavailable.title': 'Phrasen nicht verfügbar',
      'phrases.unavailable.text': 'Das Phrasen-Modul ist in diesem Content-Paket nicht enthalten.',
      'phrases.topic.empty': 'Für dieses Thema sind noch keine Phrasen hinterlegt.',
      'phrases.list.empty': 'Keine Phrasen verfügbar.',
      'phrases.auto.start': 'Auto-Modus starten',
      'phrases.auto.stop': 'Auto-Modus stoppen',
      
      // Vocabulary / Learn
      'learn.title': 'Übungen',
      'learn.progress.title': 'Dein Vokabel-Fortschritt',
      'learn.progress.topics.completed': 'Themen abgeschlossen',
      'learn.progress.topics.of': 'von',
      'learn.progress.exercises.mastered': 'Aufgaben gemeistert',
      'learn.progress.exercises.of': 'von',
      'learn.topic.progress.title': 'Dein Fortschritt',
      'learn.topic.progress.mastered': 'Beherrschte Aufgaben',
      'learn.topic.progress.noExercises': 'Keine Übungen in diesem Thema',
      'learn.topic.completed.at': 'Abgeschlossen am',
      'learn.read.empty': 'Keine Inhalte vorhanden.',
      'learn.read.listen': 'Anhören',
      'learn.read.toAssign': 'Zum Zuordnen',
      'learn.assign.empty': 'Keine Zuordnungsaufgaben verfügbar.',
      'learn.assign.question': 'Welche sorbische Übersetzung passt?',
      'learn.assign.toWrite': 'Zur Schreibübung',
      
      // Hundred Seconds
      'hundred.title': 'Sorbisch in 100 Sekunden',
      'hundred.empty.title': 'Keine Inhalte verfügbar',
      'hundred.empty.message': 'In diesem Content-Paket sind aktuell keine Beiträge für "Sorbisch in 100 Sekunden" enthalten.',
      
      // About
      'about.title': 'Impressum & Credits',
      'about.description': 'Dank an alle Partnerinnen und Partner, die Sorbisch leicht möglich machen.',
      'about.legal.publisher': 'Herausgeber: Domowina - Bund Lausitzer Sorben e.V., WITAJ-Sprachzentrum',
      'about.legal.address': 'Adresse: WITAJ-Sprachzentrum, Postplatz 2, 02625 Bautzen, www.witaj-sprachzentrum.de',
      'about.legal.phrases': 'Redewendungen zusammengestellt von Jadwiga Gerberich',
      'about.legal.editedBy': 'Bearbeitet von Bianka Wenke',
      'about.legal.hundredSeconds': 'Sorbisch in einhundert Sekunden erarbeitet von Bianka Wenke',
      'about.legal.vocabulary': 'Vokabeln erarbeitet von Annett Dschietzig, Simone Zimmermann',
      'about.legal.development': 'Technische Umsetzung und Programmierung: Adrian Zimmermann',
      'about.legal.proofreading': 'Lektorat: Maria Rehor, Bianka Wenke',
      'about.legal.speakers': 'Sprecher: Bianka Wenke, Marian Wenke, Stefan Paschke',
      'about.legal.audio': 'Audioproduktion: Simank-Film GbR',
      'about.legal.editing': 'Redaktion: Simone Zimmermann',
      'about.legal.funding': 'Das Vorhaben wird gefördert durch die Stiftung für das sorbische Volk, die jährlich auf der Grundlage der von den Abgeordneten des Deutschen Bundestages, des Landtages Brandenburg und des Sächsischen Landtages beschlossenen Haushalte Zuwendungen aus Steuermitteln erhält.',
      'about.legal.imageCredits': 'Liste der Bildnachweise unter: http://materialien.sorbischlernen.de/wp-content/uploads/Sorbisch-leicht-Bildautoren.pdf',
      
      // Topic
      'topic.title': 'Thema',
      
      // Common actions
      'common.back': 'Zurück',
      'common.toTopics': 'Zur Themenübersicht',
      'common.topicNotFound': 'Thema nicht gefunden.',
      'common.wellDone': 'Gut gemacht!',
      'common.topicCompleted': 'Du hast das Thema abgeschlossen.',
      'common.redoTopic': 'Thema wiederholen',
      
      // Hundred seconds description
      'hundred.description': 'Kleine Audio-Lektionen zum schnellen Auffrischen – perfekt für unterwegs oder zwischen zwei Terminen.',
      
      // Write exercise
      'learn.write.prompt': 'Schreibe das sorbische Wort für',
      'learn.write.yourAnswer': 'Deine Antwort',
      'learn.write.shuffle': 'Neu mischen',
      'learn.write.availableLetters': 'Verfügbare Buchstaben',
      'learn.write.finish': 'Fertigstellen',
      'learn.write.next': 'Weiter',
      'learn.write.tapLetters': 'Tippe die Buchstaben an',
      'learn.write.allUsed': 'Alle Buchstaben verwendet',
      'learn.write.a11y.selected': 'Ausgewählter Buchstabe',
      'learn.write.a11y.letter': 'Buchstabe',
      'learn.write.empty': 'Keine Schreibaufgaben verfügbar.',
      'learn.write.tryAgain': 'Fast! Versuche es erneut.',
      'learn.write.correct': 'Richtig!',
      
      // Audio
      'audio.noFile': 'Keine Audiodatei',
      'audio.auto': 'Auto',
      
      // App loading/error
      'app.error.loadingContent': 'Fehler beim Laden der Inhalte',
      'app.error.unknown': 'Unbekannter Fehler',
      'app.loading.ready': "Los geht's!",
      'app.loading.content': 'Inhalte werden geladen...',
      
      // Fallbacks
      'fallback.alphabet': 'Serbski alfabet',
      'fallback.phrases': 'Phrasen',
    },
  },
  en: {
    translation: {
      // Tab navigation
      'tabs.phrases': 'Phrases',
      'tabs.learn': 'Exercises',
      'tabs.hundred': '100 Seconds',
      'tabs.about': 'About',
      
      // Phrases
      'phrases.title': 'Overview',
      'phrases.unavailable.title': 'Phrases not available',
      'phrases.unavailable.text': 'The phrases module is not included in this content pack.',
      'phrases.topic.empty': 'No phrases have been added for this topic yet.',
      'phrases.list.empty': 'No phrases available.',
      'phrases.auto.start': 'Start auto mode',
      'phrases.auto.stop': 'Stop auto mode',
      
      // Vocabulary / Learn
      'learn.title': 'Exercises',
      'learn.progress.title': 'Your Vocabulary Progress',
      'learn.progress.topics.completed': 'Topics completed',
      'learn.progress.topics.of': 'of',
      'learn.progress.exercises.mastered': 'Exercises mastered',
      'learn.progress.exercises.of': 'of',
      'learn.topic.progress.title': 'Your Progress',
      'learn.topic.progress.mastered': 'Mastered exercises',
      'learn.topic.progress.noExercises': 'No exercises in this topic',
      'learn.topic.completed.at': 'Completed on',
      'learn.read.empty': 'No content available.',
      'learn.read.listen': 'Listen',
      'learn.read.toAssign': 'To Matching',
      'learn.assign.empty': 'No matching exercises available.',
      'learn.assign.question': 'Which Sorbian translation fits?',
      'learn.assign.toWrite': 'To Writing Exercise',
      
      // Hundred Seconds
      'hundred.title': 'Sorbian in 100 Seconds',
      'hundred.empty.title': 'No content available',
      'hundred.empty.message': 'This content pack currently contains no entries for "Sorbian in 100 Seconds".',
      
      // About
      'about.title': 'Imprint & Credits',
      'about.description': 'Thanks to all partners who make Sorbian Easy possible.',
      'about.legal.publisher': 'Publisher: Domowina - Association of Lusatian Sorbs e.V., WITAJ Language Center',
      'about.legal.address': 'Address: WITAJ Language Center, Postplatz 2, 02625 Bautzen, Germany, www.witaj-sprachzentrum.de',
      'about.legal.phrases': 'Phrases compiled by Jadwiga Gerberich',
      'about.legal.editedBy': 'Edited by Bianka Wenke',
      'about.legal.hundredSeconds': 'Sorbian in One Hundred Seconds developed by Bianka Wenke',
      'about.legal.vocabulary': 'Vocabulary developed by Annett Dschietzig, Simone Zimmermann',
      'about.legal.development': 'Technical implementation and programming: Adrian Zimmermann',
      'about.legal.proofreading': 'Proofreading: Maria Rehor, Bianka Wenke',
      'about.legal.speakers': 'Voice actors: Bianka Wenke, Marian Wenke, Stefan Paschke',
      'about.legal.audio': 'Audio production: Simank-Film GbR',
      'about.legal.editing': 'Editorial: Simone Zimmermann',
      'about.legal.funding': 'This project is funded by the Foundation for the Sorbian People, which annually receives allocations from tax funds based on budgets approved by the members of the German Bundestag, the Brandenburg State Parliament, and the Saxon State Parliament.',
      'about.legal.imageCredits': 'List of image credits at: http://materialien.sorbischlernen.de/wp-content/uploads/Sorbisch-leicht-Bildautoren.pdf',
      
      // Topic
      'topic.title': 'Topic',
      
      // Common actions
      'common.back': 'Back',
      'common.toTopics': 'To Topics Overview',
      'common.topicNotFound': 'Topic not found.',
      'common.wellDone': 'Well done!',
      'common.topicCompleted': 'You have completed the topic.',
      'common.redoTopic': 'Repeat Topic',
      
      // Hundred seconds description
      'hundred.description': 'Short audio lessons for quick refreshers – perfect for on the go or between appointments.',
      
      // Write exercise
      'learn.write.prompt': 'Write the Sorbian word for',
      'learn.write.yourAnswer': 'Your Answer',
      'learn.write.shuffle': 'Shuffle',
      'learn.write.availableLetters': 'Available Letters',
      'learn.write.finish': 'Finish',
      'learn.write.next': 'Next',
      'learn.write.tapLetters': 'Tap the letters',
      'learn.write.allUsed': 'All letters used',
      'learn.write.a11y.selected': 'Selected letter',
      'learn.write.a11y.letter': 'Letter',
      'learn.write.empty': 'No writing exercises available.',
      'learn.write.tryAgain': 'Almost! Try again.',
      'learn.write.correct': 'Correct!',
      
      // Audio
      'audio.auto': 'Auto',
      'audio.noFile': 'No audio file',

      // App loading/error
      'app.error.loadingContent': 'Error loading content',
      'app.error.unknown': 'Unknown error',
      'app.loading.ready': "Let's go!",
      'app.loading.content': 'Loading content...',
      
      // Fallbacks
      'fallback.alphabet': 'Sorbian Alphabet',
      'fallback.phrases': 'Phrases',
    },
  },
};

if (!i18n.isInitialized) {
  const deviceLocales = Localization.getLocales();
  const languageTag = deviceLocales?.[0]?.languageCode ?? DEFAULT_LANGUAGE;

  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    lng: languageTag,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'translation',
    resources,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    initImmediate: true,
  });
}

export default i18n;

