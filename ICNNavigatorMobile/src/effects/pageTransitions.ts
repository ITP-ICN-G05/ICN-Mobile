import { Animated } from 'react-native';

// Page transition effect configuration types
export interface TransitionConfig {
  dissolveSpeed?: number;    // Dissolve speed (ms)
  fadeInSpeed?: number;      // Fade in speed (ms)
  loadingDelay?: number;     // Loading delay (ms)
  onTransitionStart?: () => void;     // Transition start callback
  onTransitionComplete?: () => void;  // Transition complete callback
  onLoadingStart?: () => void;        // Loading start callback
  onLoadingEnd?: () => void;          // Loading end callback
}

// Default configuration
const DEFAULT_CONFIG: Required<TransitionConfig> = {
  dissolveSpeed: 600,
  fadeInSpeed: 400,
  loadingDelay: 800,
  onTransitionStart: () => {},
  onTransitionComplete: () => {},
  onLoadingStart: () => {},
  onLoadingEnd: () => {},
};

// Page transition effects class
export class PageTransitions {
  private fadeAnim: Animated.Value;
  private scaleAnim: Animated.Value;

  constructor(fadeAnim: Animated.Value, scaleAnim: Animated.Value) {
    this.fadeAnim = fadeAnim;
    this.scaleAnim = scaleAnim;
  }

  // Fade in/out transition effect
  fadeTransition(config: TransitionConfig = {}): void {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Start transition
    finalConfig.onTransitionStart();
    
    // Slow dissolve effect
    Animated.timing(this.fadeAnim, {
      toValue: 0,
      duration: finalConfig.dissolveSpeed,
      useNativeDriver: true,
    }).start(() => {
      // Start loading
      finalConfig.onLoadingStart();
      
      setTimeout(() => {
        // End loading
        finalConfig.onLoadingEnd();
        
        // New page fade in effect
        Animated.timing(this.fadeAnim, {
          toValue: 1,
          duration: finalConfig.fadeInSpeed,
          useNativeDriver: true,
        }).start(() => {
          finalConfig.onTransitionComplete();
        });
      }, finalConfig.loadingDelay);
    });
  }

  // Scale transition effect
  scaleTransition(config: TransitionConfig = {}): void {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    finalConfig.onTransitionStart();
    
    // Scale effect
    Animated.timing(this.scaleAnim, {
      toValue: 0.8,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(this.scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        finalConfig.onTransitionComplete();
      });
    });
  }

  // Slide transition effect
  slideTransition(direction: 'left' | 'right' | 'up' | 'down' = 'left', config: TransitionConfig = {}): void {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    // Slide effect implementation can be added here
    // Requires additional slideAnim parameter, can be extended later
    finalConfig.onTransitionComplete();
  }

  // Get animated styles
  getAnimatedStyle() {
    return {
      opacity: this.fadeAnim,
      transform: [{ scale: this.scaleAnim }]
    };
  }
}

// Convenient Hook-style function
export const createPageTransitions = (
  fadeAnim: Animated.Value, 
  scaleAnim: Animated.Value
) => {
  return new PageTransitions(fadeAnim, scaleAnim);
};

// Preset transition configurations
export const TransitionPresets = {
  // Quick transition
  quick: {
    dissolveSpeed: 300,
    fadeInSpeed: 200,
    loadingDelay: 400,
  },
  
  // Standard transition
  standard: {
    dissolveSpeed: 600,
    fadeInSpeed: 400,
    loadingDelay: 800,
  },
  
  // Slow transition
  slow: {
    dissolveSpeed: 1000,
    fadeInSpeed: 600,
    loadingDelay: 1200,
  },
  
  // Cinematic effect
  cinematic: {
    dissolveSpeed: 1500,
    fadeInSpeed: 800,
    loadingDelay: 1000,
  },
} as const;
