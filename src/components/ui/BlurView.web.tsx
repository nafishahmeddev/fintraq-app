import React from 'react';
import { View } from 'react-native';

export const BlurView = React.memo(({ style, children }: any) => (
  <View style={style}>
    {children}
  </View>
));

BlurView.displayName = 'BlurView';
