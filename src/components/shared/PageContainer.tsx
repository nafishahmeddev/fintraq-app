import { Theme, useTheme } from "@/src/providers/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
    children: React.ReactNode;
    showGradient?: boolean
}

export function PageContainer({ children, showGradient = false }: Props) {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <View style={styles.container}>
            {showGradient && <LinearGradient
                colors={[theme.colors.primary + "20", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.background}
            >
                {children}
            </LinearGradient>}

            {!showGradient && children}
        </View>
    );
}

const createStyles = (theme: Theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        background: {
            flex: 1,
        },
    });