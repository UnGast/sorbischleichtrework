import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/common/Screen';

const LEGAL_ENTRIES = [
  'Herausgeber: Domowina - Bund Lausitzer Sorben e.V., WITAJ-Sprachzentrum',
  'Adresse: WITAJ-Sprachzentrum, Postplatz 2, 02625 Bautzen, www.witaj-sprachzentrum.de',
  'Redewendungen zusammengestellt von Jadwiga Gerberich',
  'Bearbeitet von Bianka Wenke',
  'Sorbisch in einhundert Sekunden erarbeitet von Bianka Wenke',
  'Vokabeln erarbeitet von Annett Dschietzig, Simone Zimmermann',
  'Technische Umsetzung und Programmierung: Adrian Zimmermann',
  'Lektorat: Maria Rehor, Bianka Wenke',
  'Sprecher: Bianka Wenke, Marian Wenke, Stefan Paschke',
  'Audioproduktion: Simank-Film GbR',
  'Redaktion: Simone Zimmermann',
  'Das Vorhaben wird gefördert durch die Stiftung für das sorbische Volk, die jährlich auf der Grundlage der von den Abgeordneten des Deutschen Bundestages, des Landtages Brandenburg und des Sächsischen Landtages beschlossenen Haushalte Zuwendungen aus Steuermitteln erhält.',
  'Liste der Bildnachweise unter: http://materialien.sorbischlernen.de/wp-content/uploads/Sorbisch-leicht-Bildautoren.pdf',
];

export default function AboutRoute() {
  return (
    <Screen scrollable padded>
      <View style={styles.headingBlock}>
        <Text style={styles.title}>Impressum &amp; Credits</Text>
        <Text style={styles.description}>
          Dank an alle Partnerinnen und Partner, die Sorbisch leicht möglich machen.
        </Text>
      </View>

      {LEGAL_ENTRIES.map((entry) => (
        <Text key={entry} style={styles.entry}>
          {entry}
        </Text>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headingBlock: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  entry: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    marginBottom: 12,
  },
});
