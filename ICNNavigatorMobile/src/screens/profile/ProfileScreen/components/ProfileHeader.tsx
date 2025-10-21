import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, TierInfo, UserStats } from '../types';
import { Colors } from '@/constants/colors';
import { styles } from '../styles';

interface ProfileHeaderProps {
  user: User;
  tierInfo: TierInfo;
  stats: UserStats;
  avatarLoading: boolean;
  onEditProfile: () => void;
  onAvatarPress: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  tierInfo,
  stats,
  avatarLoading,
  onEditProfile,
  onAvatarPress,
}) => (
  <View style={styles.profileCard}>
    <View style={styles.profileHeader}>
      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={onAvatarPress} disabled={avatarLoading}>
          {avatarLoading ? (
            <View style={styles.avatar}>
              <ActivityIndicator size="large" color={Colors.white} />
            </View>
          ) : user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name.split(' ').map((n: string) => n[0]).join('')}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.editAvatarButton} 
          onPress={onAvatarPress}
          disabled={avatarLoading}
        >
          <Ionicons name="camera" size={16} color={Colors.white} />
        </TouchableOpacity>
      </View>
      
      {/* User Info Section */}
      <View style={styles.userInfo}>
        <View style={styles.userInfoHeader}>
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRole}>{user.role} at {user.company}</Text>
          </View>
          <TouchableOpacity style={styles.editIconButton} onPress={onEditProfile}>
            <Ionicons name="create-outline" size={22} color="rgba(27, 62, 111, 0.8)" />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.tierBadge, { backgroundColor: `${tierInfo.color}30` }]}>
          <Ionicons name={tierInfo.icon as any} size={14} color={tierInfo.color} />
          <Text style={[styles.tierText, { color: tierInfo.color }]}>
            {tierInfo.name} Member
          </Text>
        </View>
      </View>
    </View>

    {/* Stats Row */}
    <View style={styles.profileStats}>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, stats.saved === '∞' && styles.infinitySymbol]}>
          {stats.saved}
        </Text>
        <Text style={styles.statLabel}>Saved</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, stats.searches === '∞' && styles.infinitySymbol]}>
          {stats.searches}
        </Text>
        <Text style={styles.statLabel}>Searches</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{user.memberSince}</Text>
        <Text style={styles.statLabel}>Member</Text>
      </View>
    </View>
  </View>
);