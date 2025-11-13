import { useRef } from "react";
import { Dimensions, Animated, PanResponder } from "react-native";

export const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// snap *top* positions for the sheet (smaller top => more visible)
const TOP_FULL = SCREEN_HEIGHT * 0.1; // sheet fills screen
const TOP_MID = SCREEN_HEIGHT * 0.5; // 50% visible
const TOP_PEEK = SCREEN_HEIGHT * 0.8; // only ~20% visible
const MIN_TOP = TOP_FULL;
const MAX_TOP = TOP_PEEK;
// Bottom sheet logic
const initialTop = TOP_MID; // start at 50%
const currentTop = useRef(initialTop);

export const sheetTop = useRef(new Animated.Value(initialTop)).current;

const snapTo = (targetTop: number) => {
  Animated.spring(sheetTop, {
    toValue: targetTop,
    useNativeDriver: false,
    bounciness: 4,
  }).start();
  currentTop.current = targetTop;
};

export const panResponder = useRef(
  PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dy) > 5,
    onPanResponderMove: (_, gestureState) => {
      const newTop = currentTop.current + gestureState.dy;
      // clamp between full and peek
      const clamped = Math.min(Math.max(newTop, MIN_TOP), MAX_TOP);
      sheetTop.setValue(clamped);
    },
    onPanResponderRelease: (_, gestureState) => {
      const newTop = currentTop.current + gestureState.dy;
      const clamped = Math.min(Math.max(newTop, MIN_TOP), MAX_TOP);

      // choose closest snap point
      const candidates = [TOP_FULL, TOP_MID, TOP_PEEK];
      let best = candidates[0];
      let bestDist = Math.abs(clamped - best);
      for (let i = 1; i < candidates.length; i++) {
        const d = Math.abs(clamped - candidates[i]);
        if (d < bestDist) {
          best = candidates[i];
          bestDist = d;
        }
      }
      snapTo(best);
    },
  })
).current;
