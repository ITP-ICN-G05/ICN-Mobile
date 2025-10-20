import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

interface Question {
  id: string;
  title: string;
  subtitle?: string;
  type: 'single' | 'multiple';
  maxSelect?: number;
  options: { value: string; label: string }[];
}

interface OnboardingPreferences {
  userType: string;
  industries: string[];
  companySize: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Get responsive padding based on screen size
const getResponsivePadding = () => {
  if (SCREEN_WIDTH < 350) return 16;  // Small phones
  if (SCREEN_WIDTH < 400) return 20;  // Medium phones
  return 24;  // Large phones/tablets
};

export default function OnboardingModal({
  visible,
  onComplete,
  onSkip,
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<OnboardingPreferences>({
    userType: '',
    industries: [],
    companySize: '',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const questions: Question[] = [
    {
      id: 'userType',
      title: 'Welcome! How will you use ICN Navigator?',
      type: 'single',
      options: [
        { value: 'buyer', label: 'Finding suppliers' },
        { value: 'supplier', label: 'Listing my company' },
        { value: 'both', label: 'Both' },
      ],
    },
    {
      id: 'industries',
      title: 'Which industries interest you?',
      subtitle: 'Select up to 3',
      type: 'multiple',
      maxSelect: 3,
      options: [
        { value: 'Manufacturing', label: 'Manufacturing' },
        { value: 'Technology', label: 'Technology' },
        { value: 'Logistics', label: 'Logistics' },
        { value: 'Services', label: 'Services' },
        { value: 'Construction', label: 'Construction' },
        { value: 'Automotive', label: 'Automotive' },
      ],
    },
    {
      id: 'companySize',
      title: 'Preferred company size?',
      type: 'single',
      options: [
        { value: 'small', label: 'Small (1-99)' },
        { value: 'medium', label: 'Medium (100-499)' },
        { value: 'large', label: 'Large (500+)' },
        { value: 'any', label: 'Any size' },
      ],
    },
  ];

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleSingleSelect = (value: string) => {
    setPreferences({
      ...preferences,
      [currentQuestion.id]: value,
    });
  };

  const handleMultipleSelect = (value: string) => {
    const current = (preferences[currentQuestion.id as keyof OnboardingPreferences] as string[]) || [];
    const maxSelect = currentQuestion.maxSelect || 999;

    if (current.includes(value)) {
      setPreferences({
        ...preferences,
        [currentQuestion.id]: current.filter((v) => v !== value),
      });
    } else if (current.length < maxSelect) {
      setPreferences({
        ...preferences,
        [currentQuestion.id]: [...current, value],
      });
    }
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isCurrentAnswered = () => {
    const value = preferences[currentQuestion.id as keyof OnboardingPreferences];
    if (currentQuestion.type === 'multiple') {
      return Array.isArray(value) && value.length > 0;
    }
    return value !== undefined && value !== '';
  };

  const renderSingleChoice = () => (
    <View style={styles.optionsGrid}>
      {currentQuestion.options.map((option) => {
        const isSelected =
          preferences[currentQuestion.id as keyof OnboardingPreferences] === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => handleSingleSelect(option.value)}
            style={[styles.optionCard, isSelected && styles.optionCardSelected]}
          >
            <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderMultipleChoice = () => {
    const selectedItems = (preferences[currentQuestion.id as keyof OnboardingPreferences] as string[]) || [];
    const maxSelect = currentQuestion.maxSelect || 999;

    return (
      <View style={styles.optionsList}>
        {currentQuestion.options.map((option) => {
          const isSelected = selectedItems.includes(option.value);
          const isDisabled = !isSelected && selectedItems.length >= maxSelect;

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => !isDisabled && handleMultipleSelect(option.value)}
              disabled={isDisabled}
              style={[
                styles.optionChip,
                isSelected && styles.optionChipSelected,
                isDisabled && styles.optionChipDisabled,
              ]}
            >
              <View style={[styles.chipCheck, isSelected && styles.chipCheckSelected]}>
                <Text style={[styles.chipCheckText, isSelected && styles.chipCheckTextSelected]}>
                  {isSelected ? '✓' : '+'}
                </Text>
              </View>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onSkip}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.modalContainer}>
          {/* Header with progress bar */}
          <View style={styles.header}>
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>

          {/* Question content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
            {currentQuestion.subtitle && (
              <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text>
            )}

            {currentQuestion.type === 'single' && renderSingleChoice()}
            {currentQuestion.type === 'multiple' && renderMultipleChoice()}
          </ScrollView>

          {/* Navigation buttons */}
          <View style={styles.footer}>
            {currentStep > 0 && (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleNext}
              disabled={!isCurrentAnswered()}
              style={[
                styles.nextButton,
                !isCurrentAnswered() && styles.nextButtonDisabled,
                currentStep === 0 && styles.nextButtonFullWidth,
              ]}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === questions.length - 1 ? 'Get Started' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Step indicators */}
          <View style={styles.stepIndicators}>
            {questions.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentStep && styles.indicatorActive,
                  index < currentStep && styles.indicatorCompleted,
                ]}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,  // Remove padding for full-screen
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.OS === 'ios' ? 20 : 10,
    width: SCREEN_WIDTH,  // Full width
    height: SCREEN_HEIGHT,  // Full height
    maxWidth: undefined,  // Remove max width limit
    maxHeight: undefined,  // Remove max height limit
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,  // Safe area for status bar
    paddingHorizontal: getResponsivePadding(),
    paddingBottom: 0,
    position: 'relative',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F99F1C',
    borderRadius: 2,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: getResponsivePadding(),
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: getResponsivePadding(),
    paddingTop: 20,
    minHeight: 300,
  },
  questionTitle: {
    fontSize: 24,
    color: '#003366',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  questionSubtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 14,
  },
  optionsGrid: {
    marginTop: 32,
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  optionCardSelected: {
    backgroundColor: '#FEECD2',
    borderColor: '#F99F1C',
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: '#333',
  },
  optionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginTop: 32,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  optionChipSelected: {
    backgroundColor: '#F99F1C',
    borderColor: '#F99F1C',
  },
  optionChipDisabled: {
    opacity: 0.5,
  },
  chipCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCheckSelected: {
    backgroundColor: '#FFFFFF',
  },
  chipCheckText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  chipCheckTextSelected: {
    color: '#F99F1C',
  },
  chipLabel: {
    fontSize: 14,
    color: '#333',
  },
  chipLabelSelected: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    padding: getResponsivePadding(),
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,  // Safe area for iOS
    gap: 12,
    justifyContent: 'space-between',  // Better spacing
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',  // Visual separation
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,  // Larger touch target
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,  // Rounded corners like FilterModal
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  nextButton: {
    flex: 2,  // Larger than back button
    paddingVertical: 14,  // Larger touch target
    paddingHorizontal: 32,
    backgroundColor: '#F99F1C',
    borderRadius: 12,  // Rounded corners like FilterModal
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonFullWidth: {
    flex: 1,
  },
  nextButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,  // Extra padding for iOS home indicator
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5E5',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#F99F1C',
  },
  indicatorCompleted: {
    backgroundColor: '#B6D289',
  },
});

