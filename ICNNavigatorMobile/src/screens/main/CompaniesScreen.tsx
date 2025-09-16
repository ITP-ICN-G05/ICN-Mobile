import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import SearchBar from '../../components/common/SearchBar';
import CompanyCard from '../../components/common/CompanyCard';
import { Colors } from '../../constants/colors';
import { mockCompanies } from '../../data/mockCompanies';

export default function CompaniesScreen() {
  const [searchText, setSearchText] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev =>
      prev.includes(id) 
        ? prev.filter(bookId => bookId !== id)
        : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        onFilter={() => console.log('Filter pressed')}
      />
      <FlatList
        data={mockCompanies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CompanyCard
            company={item}
            onPress={() => console.log('Company pressed:', item.name)}
            onBookmark={() => toggleBookmark(item.id)}
            isBookmarked={bookmarkedIds.includes(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingVertical: 8,
  },
});