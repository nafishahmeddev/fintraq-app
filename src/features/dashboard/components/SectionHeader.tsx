import React from 'react';
import {  Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';

type SectionHeaderProps = {
  title: string;
  rightText?: string;
  onPressRight?: () => void;
};

export function SectionHeader({ title, rightText, onPressRight }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {rightText ? (
        onPressRight ? (
          <TouchableOpacity onPress={onPressRight} activeOpacity={0.8}>
            <Text style={styles.right}>{rightText}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.right}>{rightText}</Text>
        )
      ) : null}
    </View>
  );
}

