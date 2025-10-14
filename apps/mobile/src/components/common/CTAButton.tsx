import { Pressable, StyleSheet, Text, PressableProps } from 'react-native';

interface CTAButtonProps extends PressableProps {
  label: string;
}

export function CTAButton({ label, style, ...rest }: CTAButtonProps) {
  return (
    <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed, style]} {...rest}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6E9CFD',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
