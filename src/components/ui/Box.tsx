import React, { useMemo } from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { spacing, SpacingToken } from '../../theme/tokens';

type BoxProps = ViewProps & {
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  pt?: SpacingToken;
  pb?: SpacingToken;
  pl?: SpacingToken;
  pr?: SpacingToken;
  m?: SpacingToken;
  mx?: SpacingToken;
  my?: SpacingToken;
  mt?: SpacingToken;
  mb?: SpacingToken;
  ml?: SpacingToken;
  mr?: SpacingToken;
  gap?: SpacingToken;
  flex?: number;
  direction?: ViewStyle['flexDirection'];
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  bg?: string;
  radius?: number;
  borderWidth?: number;
  borderColor?: string;
};

/**
 * Box - A primitive layout component for consistent spacing.
 */
export const Box = React.memo(function Box({
  p, px, py, pt, pb, pl, pr,
  m, mx, my, mt, mb, ml, mr,
  gap,
  flex,
  direction,
  align,
  justify,
  bg,
  radius,
  borderWidth,
  borderColor,
  style,
  children,
  ...props
}: BoxProps) {
  const boxStyle = useMemo(() => {
    const s: ViewStyle = {};
    
    if (p) s.padding = spacing(p);
    if (px) s.paddingHorizontal = spacing(px);
    if (py) s.paddingVertical = spacing(py);
    if (pt) s.paddingTop = spacing(pt);
    if (pb) s.paddingBottom = spacing(pb);
    if (pl) s.paddingLeft = spacing(pl);
    if (pr) s.paddingRight = spacing(pr);
    
    if (m) s.margin = spacing(m);
    if (mx) s.marginHorizontal = spacing(mx);
    if (my) s.marginVertical = spacing(my);
    if (mt) s.marginTop = spacing(mt);
    if (mb) s.marginBottom = spacing(mb);
    if (ml) s.marginLeft = spacing(ml);
    if (mr) s.marginRight = spacing(mr);
    
    if (gap) s.gap = spacing(gap);
    if (flex !== undefined) s.flex = flex;
    if (direction) s.flexDirection = direction;
    if (align) s.alignItems = align;
    if (justify) s.justifyContent = justify;
    if (bg) s.backgroundColor = bg;
    if (radius !== undefined) s.borderRadius = radius;
    if (borderWidth !== undefined) s.borderWidth = borderWidth;
    if (borderColor) s.borderColor = borderColor;
    
    return s;
  }, [p, px, py, pt, pb, pl, pr, m, mx, my, mt, mb, ml, mr, gap, flex, direction, align, justify, bg, radius, borderWidth, borderColor]);

  return (
    <View style={[boxStyle, style]} {...props}>
      {children}
    </View>
  );
});

/**
 * HStack - Horizontal Stack
 */
export const HStack = React.memo(function HStack(props: BoxProps) {
  return <Box direction="row" align="center" {...props} />;
});

/**
 * VStack - Vertical Stack
 */
export const VStack = React.memo(function VStack(props: BoxProps) {
  return <Box direction="column" {...props} />;
});
