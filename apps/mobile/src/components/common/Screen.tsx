import { PropsWithChildren } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

interface ScreenProps extends ViewProps {
  padded?: boolean;
}

export function Screen({ children, style, padded = true, ...rest }: PropsWithChildren<ScreenProps>) {
  return (
    <View style={[styles.root, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  padded: {
    padding: 16,
  },
});
