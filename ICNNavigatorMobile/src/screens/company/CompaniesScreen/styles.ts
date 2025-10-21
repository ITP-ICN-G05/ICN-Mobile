import { StyleSheet } from 'react-native';
import { Colors } from '../../../constants/colors';

// Extended local colors (adding to the imported Colors)
const LocalColors = {
  ...Colors,
  avatarBg: '#E0E0E0', // Gray avatar background
  headerBg: '#FFFFFF', // Statistics area background color changed to white
  searchBg: '#FFFFFF', // Search bar background color changed to white
  statNumber: '#F7B85C', // Warm light orange for statistics
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.black50,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.black50,
    textAlign: 'center',
    marginHorizontal: 40,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: LocalColors.headerBg,
    marginBottom: 8,
  },
  tierBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.orange[400],
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tierBarText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  upgradeLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: LocalColors.statNumber,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.black50,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.black20,
    marginVertical: 8,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  viewToggle: {
    padding: 4,
  },
  sortOptions: {
    backgroundColor: LocalColors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  sortOptionActive: {
    backgroundColor: Colors.orange[400],
  },
  sortOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  sortOptionTextActive: {
    fontWeight: '600',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.orange[400],
  },
  activeFiltersInfo: {
    flex: 1,
    marginRight: 8,
  },
  activeFiltersText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  filterBadgesScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.text,
  },
  clearFiltersText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  bookmarkedSection: {
    paddingVertical: 12,
    backgroundColor: LocalColors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionCount: {
    fontSize: 14,
    color: Colors.black50,
  },
  bookmarkedList: {
    paddingHorizontal: 16,
  },
  bookmarkedCard: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: Colors.black20,
  },
  bookmarkedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LocalColors.avatarBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookmarkedAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  bookmarkedName: {
    fontSize: 12,
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.black50,
    textAlign: 'center',
    marginBottom: 24,
  },
  clearButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  clearButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    margin: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LocalColors.avatarBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
    height: 34,
  },
  gridAddress: {
    fontSize: 11,
    color: Colors.black50,
    textAlign: 'center',
    marginBottom: 8,
  },
  gridBookmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
});