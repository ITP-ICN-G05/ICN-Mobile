import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Colors } from '@/constants/colors';
import { Pagination } from './Pagination';
import { getDisplayValue } from '../utils';

interface ItemsServicesProps {
  company: any;
  currentTier: string;
  isItemsExpanded: boolean;
  expandedGroups: Set<string>;
  currentGroups: any[];
  currentPage: number;
  totalPages: number;
  groupedCapabilities: any[];
  onToggleExpand: () => void;
  onToggleGroup: (itemName: string) => void;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export const ItemsServices: React.FC<ItemsServicesProps> = ({
  company,
  currentTier,
  isItemsExpanded,
  expandedGroups,
  currentGroups,
  currentPage,
  totalPages,
  groupedCapabilities,
  onToggleExpand,
  onToggleGroup,
  onPageChange,
  onNextPage,
  onPrevPage,
}) => {
  if (!company.icnCapabilities || company.icnCapabilities.length === 0) {
    return null;
  }

  const renderCapabilityItem = (cap: any) => (
    <View key={cap.capabilityId} style={styles.modernCapabilityItem}>
      <View style={styles.capabilityHeader}>
        <View style={styles.capabilityIcon}>
          <Ionicons name="cube-outline" size={18} color={Colors.primary} />
        </View>
        <View style={styles.capabilityContent}>
          <Text style={styles.modernCapabilityName}>{cap.itemName}</Text>
          {getDisplayValue(cap.detailedItemName, '') && (
            <Text style={styles.modernCapabilityDetail}>{cap.detailedItemName}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.capabilityTags}>
        {(currentTier === 'plus' || currentTier === 'premium') && (
          <View style={styles.modernCapabilityTypeBadge}>
            <Text style={styles.modernCapabilityTypeText}>{cap.capabilityType}</Text>
          </View>
        )}
        
        {currentTier === 'premium' && cap.localContentPercentage && (
          <View style={styles.localContentBadge}>
            <Text style={styles.localContentBadgeText}>
              {cap.localContentPercentage}% Local
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderCapabilityGroup = (group: any, groupIndex: number) => {
    const isExpanded = expandedGroups.has(group.itemName);
    
    return (
      <View key={`group-${group.itemName}-${groupIndex}`} style={styles.capabilityGroupContainer}>
        <TouchableOpacity 
          style={styles.capabilityGroupHeader}
          onPress={() => onToggleGroup(group.itemName)}
          activeOpacity={1}
        >
          <View style={styles.capabilityGroupLeft}>
            <View style={styles.capabilityIcon}>
              <Ionicons name="cube-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.capabilityGroupTitle}>{group.itemName}</Text>
            <View style={styles.groupCountBadge}>
              <Text style={styles.groupCountText}>{group.count}</Text>
            </View>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={Colors.black50} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.capabilityGroupItems}>
            {group.items.map((cap: any, itemIndex: number) => (
              <View key={`${cap.capabilityId}-${itemIndex}`} style={styles.capabilitySubItem}>
                <View style={styles.subItemIndicator}>
                  <View style={styles.subItemBullet} />
                  <Text style={styles.subItemNumber}>{itemIndex + 1}</Text>
                </View>
                
                <View style={styles.capabilitySubContent}>
                  {getDisplayValue(cap.detailedItemName, '') && (
                    <Text style={styles.capabilitySubItemName}>
                      {cap.detailedItemName}
                    </Text>
                  )}
                  
                  <View style={styles.capabilityTags}>
                    {(currentTier === 'plus' || currentTier === 'premium') && (
                      <View style={styles.modernCapabilityTypeBadge}>
                        <Text style={styles.modernCapabilityTypeText}>{cap.capabilityType}</Text>
                      </View>
                    )}
                    
                    {currentTier === 'premium' && cap.localContentPercentage && (
                      <View style={styles.localContentBadge}>
                        <Text style={styles.localContentBadgeText}>
                          {cap.localContentPercentage}% Local
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={onToggleExpand}
        activeOpacity={1}
      >
        <View style={styles.titleWithBadge}>
          <Text style={styles.cardTitleStyled}>Items & Services</Text>
          <View style={styles.itemsCountBadge}>
            <Text style={styles.itemsCountBadgeText}>
              {totalPages > 1 && isItemsExpanded 
                ? `${Math.min((currentPage + 1) * currentGroups.length, groupedCapabilities.length)}/${groupedCapabilities.length}`
                : `${groupedCapabilities.length}`
              }
            </Text>
          </View>
        </View>
        <Ionicons
          name={isItemsExpanded ? "chevron-up" : "chevron-down"}
          size={20} 
          color={Colors.black50} 
        />
      </TouchableOpacity>
      
      {isItemsExpanded && (
        <View style={styles.collapsibleContent}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onNext={onNextPage}
            onPrev={onPrevPage}
            onPageChange={onPageChange}
          />
          
          {currentGroups.map((group, groupIndex) => {
            if (!group.isGroup) {
              return renderCapabilityItem(group.items[0]);
            }
            return renderCapabilityGroup(group, groupIndex);
          })}
        </View>
      )}
      
      {!isItemsExpanded && (
        <View style={styles.previewContainer}>
          <View style={styles.previewTags}>
            {groupedCapabilities.slice(0, 3).map((group, index) => (
              <View key={index} style={styles.previewTag}>
                <Text style={styles.previewTagText}>
                  {group.itemName}{group.isGroup ? ` (${group.count})` : ''}
                </Text>
              </View>
            ))}
            {groupedCapabilities.length > 3 && (
              <View style={styles.moreTag}>
                <Text style={styles.moreTagText}>+{groupedCapabilities.length - 3} more</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};