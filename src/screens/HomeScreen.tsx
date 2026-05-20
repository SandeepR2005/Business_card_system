import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { EVA } from '../utils/theme';
import { AppBar, Icon, Card, Chip } from '../components/ui';
import { Lead } from '../types';
import StorageService from '../utils/storage';

export default function HomeScreen({ navigation }: any) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');

  // Reload leads from storage each time this screen is focused
  useFocusEffect(
    useCallback(() => {
      StorageService.getLeads().then(setLeads).catch(console.error);
    }, []),
  );

  const newLeads = leads.filter((l) => l.status === 'new');
  const recentActivity = leads.flatMap((l) => l.activity.slice(0, 2)).slice(0, 5);

  const handleRefresh = () => {
    setSyncStatus('syncing');
    StorageService.getLeads()
      .then(setLeads)
      .catch(console.error)
      .finally(() => setSyncStatus('synced'));
  };

  const handleLeadPress = (leadId: string) => {
    navigation.navigate('LeadDetail', { leadId });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: EVA.surface }}>
      <ScrollView style={{ flex: 1 }}>
        <AppBar
          title="Home"
          dark={false}
          left={<Icon name="home" size={22} color={EVA.green} />}
          right={
            <TouchableOpacity onPress={handleRefresh}>
              <Icon
                name="refresh"
                size={20}
                color={syncStatus === 'syncing' ? EVA.green : EVA.muted}
              />
            </TouchableOpacity>
          }
        />

        <View style={styles.container}>
          {/* Summary Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{leads.length}</Text>
              <Text style={styles.statLabel}>Total Leads</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{newLeads.length}</Text>
              <Text style={styles.statLabel}>New Today</Text>
            </View>
          </View>

          {/* New Leads Section */}
          {newLeads.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>New Leads</Text>
              <View style={{ gap: 12 }}>
                {newLeads.map((lead) => (
                  <TouchableOpacity
                    key={lead.id}
                    onPress={() => handleLeadPress(lead.id)}
                  >
                    <Card>
                      <View style={styles.leadHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.leadName}>{lead.name}</Text>
                          <Text style={styles.leadRole}>{lead.role}</Text>
                        </View>
                        <View
                          style={[
                            styles.scoreTag,
                            {
                              backgroundColor:
                                lead.score >= 80
                                  ? 'rgba(82, 196, 26, 0.1)'
                                  : 'rgba(224, 138, 30, 0.1)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.scoreText,
                              {
                                color:
                                  lead.score >= 80 ? EVA.green : EVA.warn,
                              },
                            ]}
                          >
                            {lead.score}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.leadCompany}>{lead.company}</Text>
                      <View style={styles.tagsRow}>
                        {lead.tags.slice(0, 2).map((tag) => (
                          <Chip key={tag} label={tag} />
                        ))}
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Card>
                {recentActivity.map((activity, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.activityItem,
                      idx !== recentActivity.length - 1 && styles.activityItemBorder,
                    ]}
                  >
                    <View style={styles.activityIcon}>
                      <Icon
                        name={activity.k}
                        size={16}
                        color={EVA.green}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityText}>{activity.text}</Text>
                      <Text style={styles.activityTime}>{activity.t}</Text>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: EVA.greenSoft,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: EVA.greenDeep,
  },
  statLabel: {
    fontSize: 12,
    color: EVA.greenDeep,
    fontWeight: '500',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: EVA.ink,
    marginTop: 8,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
    marginBottom: 8,
  },
  scoreTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: EVA.hairline,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: EVA.greenSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: {
    fontSize: 13,
    color: EVA.body,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 11,
    color: EVA.muted,
    marginTop: 2,
  },
});
