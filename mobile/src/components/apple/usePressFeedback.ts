import { useRef } from 'react';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

/** Resorte con rebote corto, como los controles de iOS. */
const PRESS_SPRING = { damping: 14, stiffness: 420, mass: 0.6 };
const RELEASE_SPRING = { damping: 11, stiffness: 260, mass: 0.7 };
const HOVER_SCALE = 1.02;

/**
 * Respuesta táctil estilo iOS para botones del kit:
 * - al tocar, el control se hunde (`pressedScale`) y se ilumina;
 * - al soltar, vuelve con un resorte que rebota levemente;
 * - en web, al pasar el ratón crece un poco. La presión siempre tiene prioridad sobre el hover.
 */
export function usePressFeedback(pressedScale = 0.94) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const pressed = useRef(false);
  const hovered = useRef(false);

  const container = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const highlight = useAnimatedStyle(() => ({ opacity: glow.get() }));
  /** Para íconos que se desplazan al presionar, por ejemplo una flecha. */
  const nudge = useAnimatedStyle(() => ({ transform: [{ translateX: glow.get() * 4 }] }));

  const rest = () => (hovered.current ? HOVER_SCALE : 1);

  const handlers = {
    onPressIn: () => {
      pressed.current = true;
      scale.set(withSpring(pressedScale, PRESS_SPRING));
      glow.set(withSpring(1, PRESS_SPRING));
    },
    onPressOut: () => {
      pressed.current = false;
      scale.set(withSpring(rest(), RELEASE_SPRING));
      glow.set(withSpring(0, RELEASE_SPRING));
    },
    onHoverIn: () => {
      hovered.current = true;
      if (!pressed.current) scale.set(withSpring(HOVER_SCALE, RELEASE_SPRING));
    },
    onHoverOut: () => {
      hovered.current = false;
      if (!pressed.current) scale.set(withSpring(1, RELEASE_SPRING));
    },
  };

  return { container, highlight, nudge, handlers };
}
