import React, { useMemo, useCallback } from 'react';
import { ActivityIndicator, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { spacing, radius } from '../../theme/tokens';

type ConfirmDialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
};

export const ConfirmDialog = React.memo(function ConfirmDialog({
  visible,
  onClose,
  title,
  message,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  isLoading = false,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleConfirm = useCallback(() => {
    onClose();
    onConfirm();
  }, [onClose, onConfirm]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.9}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, destructive ? styles.confirmButtonDestructive : styles.confirmButtonNeutral, isLoading && { opacity: 0.7 }]}
              onPress={handleConfirm}
              activeOpacity={0.9}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: '#000000CC',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing('6'),
      paddingBottom: spacing('10.5'),
    },
    card: {
      alignSelf: 'stretch',
      borderRadius: radius('2xl'),
      backgroundColor: Platform.OS === 'ios' ? colors.background + 'F2' : colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing('4.5'),
      shadowColor: '#000000',
      shadowOpacity: 0.22,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    },
    title: {
      fontFamily: TYPOGRAPHY.fonts.headingRegular,
      fontSize: 24,
      color: colors.text,
      letterSpacing: -0.6,
    },
    message: {
      marginTop: spacing('1.5'),
      marginBottom: spacing('4'),
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing('2.5'),
    },
    cancelButton: {
      flex: 1,
      height: 46,
      borderRadius: radius('md'),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 14,
      color: colors.text,
    },
    confirmButton: {
      flex: 1,
      height: 46,
      borderRadius: radius('md'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmButtonDestructive: {
      backgroundColor: colors.danger,
    },
    confirmButtonNeutral: {
      backgroundColor: colors.primary,
    },
    confirmText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 14,
      color: '#FFFFFF',
    },
  });
