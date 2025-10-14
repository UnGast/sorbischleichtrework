import { StyleSheet, Text, View } from 'react-native';

export function AudioBar() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Audio controls coming soon…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#111827',
    borderRadius: 16,
    marginTop: 16,
  },
  text: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});
