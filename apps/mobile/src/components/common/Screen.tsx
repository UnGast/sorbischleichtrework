import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps extends ViewProps {
  scrollable?: boolean;
  padded?: boolean;
}

export function Screen({ children, scrollable = false, padded = true, style, ...rest }: PropsWithChildren<ScreenProps>) {
  const content = scrollable ? (
    <ScrollView contentContainerStyle={[padded && styles.padded]} style={style} {...rest}>
      {children}
    </ScrollView>
  ) : (
    <SafeAreaView /*style={[styles.root, padded && styles.padded, style]}*/ {...rest}>
      {children}
    </SafeAreaView>
  );

  return content;
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
