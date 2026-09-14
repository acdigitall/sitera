import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  highlight?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, highlight }) => {
  return (
    <View style={[styles.card, highlight && styles.highlightCard, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  highlightCard: {
    borderColor: colors.borderActive,
    backgroundColor: colors.surfaceLight,
  },
});
