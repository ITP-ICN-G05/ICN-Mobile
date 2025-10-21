import React from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCompanyDetail } from './hooks/useCompanyDetail';
import { CompanyHeader } from './components/CompanyHeader';
import { ItemsServices } from './components/ItemsServices';
import { NewsTrends } from './components/NewsTrends';
import { PastProjects } from './components/PastProjects';
import { ContactInfo } from './components/ContactInfo';
import { CompanyInfoPlus } from './components/CompanyInfoPlus';
import { PremiumFeatures } from './components/PremiumFeatures';
import { QuickActions } from './components/QuickActions';
import { CompanyBasicInfo } from './components/CompanyBasicInfo';
import { styles } from './styles';

export default function CompanyDetailScreen({ route, navigation }: any) {
  const {
    company,
    loading,
    currentTier,
    insets,
    isItemsExpanded,
    isNewsExpanded,
    isProjectsExpanded,
    isContactExpanded,
    isCompanyInfoExpanded,
    isSummaryExpanded,
    expandedGroups,
    currentPage,
    currentProjectPage,
    totalPages,
    totalProjectPages,
    currentGroups,
    currentProjects,
    groupedCapabilities,
    projectsData,
    displayName,
    handleBack,
    handleBookmark,
    handleShare,
    handleExport,
    handleICNChat,
    handleGatewayLink,
    handleICNContact,
    handleDirections,
    handleEmail,
    handleCall,
    handleWebsite,
    toggleGroup,
    handleNextPage,
    handlePrevPage,
    handleNextProjectPage,
    handlePrevProjectPage,
    setIsItemsExpanded,
    setIsNewsExpanded,
    setIsProjectsExpanded,
    setIsContactExpanded,
    setIsCompanyInfoExpanded,
    setIsSummaryExpanded,
    setCurrentPage,
    setCurrentProjectPage,
    isBookmarked,
  } = useCompanyDetail(route, navigation);

  if (loading) {
    return (
      <View style={styles.container}>
        <CompanyHeader
          company={company}
          displayName={displayName}
          isBookmarked={isBookmarked}
          onBack={handleBack}
          onShare={handleShare}
          onBookmark={handleBookmark}
        />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#F8B657" />
          <Text style={{ marginTop: 16, color: '#666' }}>Loading details...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CompanyHeader
        company={company}
        displayName={displayName}
        isBookmarked={isBookmarked}
        onBack={handleBack}
        onShare={handleShare}
        onBookmark={handleBookmark}
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 }
        ]}
      >
        <CompanyBasicInfo
          company={company}
          currentTier={currentTier}
          displayName={displayName}
          isBookmarked={isBookmarked}
          isSummaryExpanded={isSummaryExpanded}
          onBookmark={handleBookmark}
          onToggleSummary={() => setIsSummaryExpanded(!isSummaryExpanded)}
        />

        <ItemsServices
          company={company}
          currentTier={currentTier}
          isItemsExpanded={isItemsExpanded}
          expandedGroups={expandedGroups}
          currentGroups={currentGroups}
          currentPage={currentPage}
          totalPages={totalPages}
          groupedCapabilities={groupedCapabilities}
          onToggleExpand={() => setIsItemsExpanded(!isItemsExpanded)}
          onToggleGroup={toggleGroup}
          onPageChange={setCurrentPage}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
        />

        <NewsTrends
          company={company}
          isNewsExpanded={isNewsExpanded}
          onToggleExpand={() => setIsNewsExpanded(!isNewsExpanded)}
        />

        <PastProjects
          currentTier={currentTier}
          isProjectsExpanded={isProjectsExpanded}
          currentProjects={currentProjects}
          currentProjectPage={currentProjectPage}
          totalProjectPages={totalProjectPages}
          projectsData={projectsData}
          onToggleExpand={() => setIsProjectsExpanded(!isProjectsExpanded)}
          onNextProjectPage={handleNextProjectPage}
          onPrevProjectPage={handlePrevProjectPage}
          onProjectPageChange={setCurrentProjectPage}
        />

        <ContactInfo
          company={company}
          isContactExpanded={isContactExpanded}
          onToggleExpand={() => setIsContactExpanded(!isContactExpanded)}
          onEmail={handleEmail}
          onCall={handleCall}
          onWebsite={handleWebsite}
          onICNContact={handleICNContact}
        />

        <CompanyInfoPlus
          company={company}
          currentTier={currentTier}
          isCompanyInfoExpanded={isCompanyInfoExpanded}
          onToggleExpand={() => setIsCompanyInfoExpanded(!isCompanyInfoExpanded)}
          onICNChat={handleICNChat}
          onGatewayLink={handleGatewayLink}
        />

        <PremiumFeatures
          company={company}
          currentTier={currentTier}
        />

        <QuickActions
          currentTier={currentTier}
          onDirections={handleDirections}
          onICNChat={handleICNChat}
          onExport={handleExport}
        />
      </ScrollView>
    </SafeAreaView>
  );
}