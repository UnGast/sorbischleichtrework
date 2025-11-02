import { PropsWithChildren } from 'react';
import { Platform, ScrollView, StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';

interface ScreenProps extends ViewProps {
  scrollable?: boolean;
  padded?: boolean;
  edges?: Edge[];
}

const DEFAULT_EDGES: Edge[] = ['left', 'right'];
const SCROLL_PADDING_HORIZONTAL = 16;
const SCROLL_PADDING_VERTICAL = 12;
const SCROLL_BOTTOM_EXTRA = Platform.select({ ios: 12, default: 8 });

export function Screen({
  children,
  scrollable = false,
  padded = true,
  style,
  edges = DEFAULT_EDGES,
  ...rest
}: PropsWithChildren<ScreenProps>) {
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={
            padded
              ? [
                  styles.scrollPadded,
                  {
                    paddingHorizontal: SCROLL_PADDING_HORIZONTAL,
                    paddingTop: SCROLL_PADDING_VERTICAL,
                    paddingBottom: SCROLL_PADDING_VERTICAL + SCROLL_BOTTOM_EXTRA,
                  },
                ]
              : undefined
          }
          style={[styles.scroll, style]}
          {...rest}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.inner, padded && styles.padded, style]} {...rest}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 0,
  },
  scrollPadded: {
    minHeight: '100%',
  },
});
