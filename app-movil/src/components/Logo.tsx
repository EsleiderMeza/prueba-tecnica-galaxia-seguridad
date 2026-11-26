import { Text, View } from 'react-native';
import { colors } from '../theme';

/**
 * Marca simple de triángulo (dorado con interior negro y un punto de luz),
 * dibujada con vistas para no depender de imágenes.
 */
export function LogoMark({ size = 72 }: { size?: number }) {
  const h = size * 0.9;
  const inner = size * 0.78;
  const innerH = h * 0.78;
  return (
    <View style={{ width: size, height: h, alignItems: 'center' }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size / 2,
          borderRightWidth: size / 2,
          borderBottomWidth: h,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: colors.accent,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: h - innerH - size * 0.05,
          width: 0,
          height: 0,
          borderLeftWidth: inner / 2,
          borderRightWidth: inner / 2,
          borderBottomWidth: innerH,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: colors.black,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: h * 0.52,
          width: size * 0.12,
          height: size * 0.12,
          borderRadius: size,
          backgroundColor: '#fff',
          shadowColor: '#fff',
          shadowOpacity: 0.9,
          shadowRadius: 6,
        }}
      />
    </View>
  );
}

export function Logo({ size = 72 }: { size?: number }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <LogoMark size={size} />
      <Text style={{ color: colors.accent, fontSize: size * 0.24, fontWeight: '800', letterSpacing: 2, marginTop: 6 }}>
        GALAXIA
      </Text>
    </View>
  );
}
