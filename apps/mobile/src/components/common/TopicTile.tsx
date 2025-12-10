import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePrimaryColor } from '@/hooks/usePrimaryColor';

interface TopicTileProps {
  name: string;
  subtitle?: string;
  statusLabel?: string;
  completed?: boolean;
  isSpecial?: boolean;
  onPress?: () => void;
}

export function TopicTile({ name, subtitle, statusLabel, completed = false, isSpecial = false, onPress }: TopicTileProps) {
  const primaryColor = usePrimaryColor();

  return (
    <TouchableOpacity 
      style={[styles.container, isSpecial && { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B' }]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={styles.textContainer}>
        <View style={styles.nameRow}>
          {isSpecial ? (
            <Ionicons name="text-outline" size={18} color="#D97706" style={styles.specialIcon} />
          ) : null}
          <Text style={[styles.name, isSpecial && { color: '#92400E' }]}>{name}</Text>
        </View>
        {subtitle ? <Text style={[styles.subtitle, isSpecial && { color: '#B45309' }]}>{subtitle}</Text> : null}
        {statusLabel ? (
          <Text style={[styles.status, { color: primaryColor }]}>{statusLabel}</Text>
        ) : null}
      </View>
      {completed ? (
        <View style={[styles.badge, { backgroundColor: primaryColor }]}>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialIcon: {
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
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
    color: '#4B5563',
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

