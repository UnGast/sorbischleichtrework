import { Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TopicTileProps {
  name: string;
  subtitle?: string;
  icon?: ImageSourcePropType;
  onPress?: () => void;
}

export function TopicTile({ name, subtitle, icon, onPress }: TopicTileProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {icon ? <Image source={icon} style={styles.icon} /> : <View style={[styles.icon, styles.iconPlaceholder]} />}
      <View style={styles.textContainer}>
        <Text style={styles.name}>{name}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
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
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E4E4E7',
  },
  iconPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 16,
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
});
