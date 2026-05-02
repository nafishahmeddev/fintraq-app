import React, { useMemo, useCallback } from 'react';
import { ActivityIndicator, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

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
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

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
              style={[
                styles.confirmButton, 
                destructive ? styles.confirmButtonDestructive : styles.confirmButtonNeutral, 
                isLoading && { opacity: 0.7 }
              ]}
              onPress={handleConfirm}
              activeOpacity={0.9}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} size="small" />
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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.52)',
      justifyContent: 'flex-end',
      paddingHorizontal: theme.layout.screenPadding,
      paddingBottom: 42,
    },
    card: {
      alignSelf: 'stretch',
      borderRadius: theme.radius['2xl'],
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing[20],
      ...theme.shadow.lg,
    },
    title: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 24,
      color: theme.colors.text,
      letterSpacing: -0.6,
    },
    message: {
      marginTop: theme.spacing[8],
      marginBottom: theme.spacing[20],
      fontFamily: theme.fontFamilies.sans,
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textMuted,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: theme.spacing[12],
    },
    cancelButton: {
      flex: 1,
      height: 48,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 14,
      color: theme.colors.text,
    },
    confirmButton: {
      flex: 1,
      height: 48,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmButtonDestructive: {
      backgroundColor: theme.colors.danger,
    },
    confirmButtonNeutral: {
      backgroundColor: theme.colors.primary,
    },
    confirmText: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 14,
      color: theme.colors.background,
    },
  });
