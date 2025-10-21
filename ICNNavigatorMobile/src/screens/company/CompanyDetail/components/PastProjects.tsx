import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Colors } from '@/constants/colors';
import { Pagination } from './Pagination';

interface PastProjectsProps {
  currentTier: string;
  isProjectsExpanded: boolean;
  currentProjects: any[];
  currentProjectPage: number;
  totalProjectPages: number;
  projectsData: any[];
  onToggleExpand: () => void;
  onNextProjectPage: () => void;
  onPrevProjectPage: () => void;
  onProjectPageChange: (page: number) => void;
}

export const PastProjects: React.FC<PastProjectsProps> = ({
  currentTier,
  isProjectsExpanded,
  currentProjects,
  currentProjectPage,
  totalProjectPages,
  projectsData,
  onToggleExpand,
  onNextProjectPage,
  onPrevProjectPage,
  onProjectPageChange,
}) => {
  if (currentTier !== 'premium' || projectsData.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.collapsibleHeader}
        onPress={onToggleExpand}
        activeOpacity={1}
      >
        <View style={styles.clickableCardLeft}>
          <Ionicons name="briefcase-outline" size={24} color={Colors.primary} />
          <View style={styles.clickableCardText}>
            <Text style={styles.clickableCardTitle}>Past Projects</Text>
            <Text style={styles.clickableCardSubtitle}>
              View {projectsData.length} completed projects and outcomes
            </Text>
          </View>
        </View>
        <Ionicons 
          name={isProjectsExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={Colors.black50} 
        />
      </TouchableOpacity>
      
      {isProjectsExpanded && (
        <View style={styles.collapsibleContent}>
          <View style={styles.projectsContainer}>
            {currentProjects.map((project, index) => (
              <View key={project.id || index} style={styles.modernProjectItem}>
                <View style={styles.projectMainInfo}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <Text style={styles.projectDescription}>{project.description}</Text>
                </View>
                
                <View style={styles.projectTags}>
                  <View style={styles.projectClientBadge}>
                    <Ionicons name="business-outline" size={12} color={Colors.primary} />
                    <Text style={styles.projectClientText}>{project.client}</Text>
                  </View>
                  
                  <View style={styles.projectDateBadge}>
                    <Ionicons name="calendar-outline" size={12} color={Colors.black50} />
                    <Text style={styles.projectDateText}>{project.date}</Text>
                  </View>
                  
                  {project.value && (
                    <View style={styles.projectValueBadge}>
                      <Ionicons name="cash-outline" size={12} color={Colors.success} />
                      <Text style={styles.projectValueText}>{project.value}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
          
          <Pagination
            currentPage={currentProjectPage}
            totalPages={totalProjectPages}
            onNext={onNextProjectPage}
            onPrev={onPrevProjectPage}
            onPageChange={onProjectPageChange}
          />
        </View>
      )}
    </View>
  );
};