import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { EVA } from '../utils/theme';
import { AppBar, Icon, Card } from '../components/ui';
import { TEAM } from '../utils/data';

export default function LMSScreen() {
  const [team] = useState(TEAM);

  const renderTeamMember = ({ item }: any) => (
    <Card>
      <View style={styles.memberRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberRole}>{item.role}</Text>
          <Text style={styles.memberRegion}>{item.region}</Text>
        </View>
        <View style={styles.statsBox}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.captured}</Text>
            <Text style={styles.statLabel}>Captured</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValueToday}>+{item.todayDelta}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>
      </View>
    </Card>
  );

  const totalCaptured = team.reduce((sum, m) => sum + m.captured, 0);
  const totalToday = team.reduce((sum, m) => sum + m.todayDelta, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: EVA.surface }}>
      <ScrollView style={{ flex: 1 }}>
        <AppBar
          title="LMS"
          dark={false}
          left={<Icon name="chart" size={22} color={EVA.green} />}
        />

        <View style={styles.container}>
          {/* Team Stats Summary */}
          <Card>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{totalCaptured}</Text>
                <Text style={styles.summaryLabel}>Total Leads</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{totalToday}</Text>
                <Text style={styles.summaryLabel}>Today</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{team.length}</Text>
                <Text style={styles.summaryLabel}>Team Members</Text>
              </View>
            </View>
          </Card>

          {/* Team Leaderboard */}
          <Text style={styles.sectionTitle}>Team Performance</Text>
          <FlatList
            data={team}
            renderItem={renderTeamMember}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: EVA.greenSoft,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: EVA.green,
  },
  summaryLabel: {
    fontSize: 11,
    color: EVA.greenDeep,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: EVA.ink,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: EVA.ink,
  },
  memberRole: {
    fontSize: 12,
    color: EVA.muted,
    marginTop: 2,
  },
  memberRegion: {
    fontSize: 11,
    color: EVA.body,
    marginTop: 2,
  },
  statsBox: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: EVA.green,
  },
  statValueToday: {
    fontSize: 14,
    fontWeight: '600',
    color: EVA.warn,
  },
  statLabel: {
    fontSize: 10,
    color: EVA.muted,
    marginTop: 2,
  },
  listContent: {
    gap: 12,
  },
});
