import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { EVA } from '../utils/theme';
import { AppBar, Icon, Card, Chip } from '../components/ui';
import { Lead } from '../types';
import StorageService from '../utils/storage';

export default function LeadListScreen({ navigation }: any) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load leads from storage when screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadLeads = async () => {
        try {
          setIsLoading(true);
          const storedLeads = await StorageService.getLeads();
          setLeads(storedLeads);
        } catch (error) {
          console.error('Error loading leads:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadLeads();
    }, []),
  );

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchText.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchText.toLowerCase());
    const matchesFilter = !filterStatus || lead.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleLeadPress = (leadId: string) => {
    navigation.navigate('LeadDetail', { leadId });
  };

  const renderLead = ({ item }: { item: Lead }) => (
    <TouchableOpacity onPress={() => handleLeadPress(item.id)}>
      <Card>
        <View style={styles.leadHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.leadName}>{item.name}</Text>
            <Text style={styles.leadRole}>{item.role}</Text>
            <Text style={styles.leadCompany}>{item.company}</Text>
          </View>
          <View
            style={[
              styles.scoreTag,
              {
                backgroundColor:
                  item.score >= 80
                    ? 'rgba(82, 196, 26, 0.1)'
                    : 'rgba(224, 138, 30, 0.1)',
              },
            ]}
          >
            <Text
              style={[
                styles.scoreText,
                { color: item.score >= 80 ? EVA.green : EVA.warn },
              ]}
            >
              {item.score}
            </Text>
          </View>
        </View>
        <View style={styles.leadMeta}>
          <Text style={styles.leadMeta}>
            {item.capturedAt} • {item.capturedBy}
          </Text>
        </View>
        {item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 2).map((tag) => (
              <Chip key={tag} label={tag} />
            ))}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: EVA.surface }}>
      <AppBar
        title="Leads"
        dark={false}
        left={<Icon name="users" size={22} color={EVA.green} />}
        right={
          <TouchableOpacity>
            <Icon name="filter" size={20} color={EVA.muted} />
          </TouchableOpacity>
        }
      />

      <View style={styles.container}>
        {/* Search */}
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color={EVA.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads..."
            placeholderTextColor={EVA.muted}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          {[
            { key: null, label: 'All' },
            { key: 'new', label: 'New' },
            { key: 'contacted', label: 'Contacted' },
            { key: 'followup', label: 'Follow-up' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setFilterStatus(filter.key)}
              style={[
                styles.filterTab,
                filterStatus === filter.key && styles.filterTabActive,
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filterStatus === filter.key && styles.filterTabTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Leads List */}
        <FlatList
          data={filtered}
          renderItem={renderLead}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="search" size={32} color={EVA.muted} />
              <Text style={styles.emptyText}>
                {isLoading ? 'Loading leads...' : 'No leads found'}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EVA.canvas,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: EVA.hairline,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: EVA.ink,
    fontSize: 14,
  },
  filterTabs: {
    gap: 8,
    marginVertical: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: EVA.canvas,
    borderWidth: 1,
    borderColor: EVA.hairline,
  },
  filterTabActive: {
    backgroundColor: EVA.green,
    borderColor: EVA.green,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: EVA.body,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContent: {
    gap: 12,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  leadName: {
    fontSize: 14,
    fontWeight: '600',
    color: EVA.ink,
  },
  leadRole: {
    fontSize: 12,
    color: EVA.muted,
    marginTop: 2,
  },
  leadCompany: {
    fontSize: 12,
    color: EVA.body,
    marginTop: 2,
  },
  leadMeta: {
    fontSize: 11,
    color: EVA.muted,
    marginTop: 8,
  },
  scoreTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: EVA.muted,
    fontWeight: '500',
  },
});
