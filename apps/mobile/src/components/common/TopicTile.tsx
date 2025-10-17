import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TopicTileProps {
  name: string;
  subtitle?: string;
  statusLabel?: string;
  completed?: boolean;
  onPress?: () => void;
}

export function TopicTile({ name, subtitle, statusLabel, completed = false, onPress }: TopicTileProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{name}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {statusLabel ? (
          <Text style={[styles.status, completed && styles.statusCompleted]}>{statusLabel}</Text>
        ) : null}
      </View>
      {completed ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✓</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4F4F5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  status: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#1D4ED8',
  },
  statusCompleted: {
    color: '#10B981',
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

