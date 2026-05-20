import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { EVA } from '../utils/theme';
import { AppBar, Icon, Card, Chip } from '../components/ui';
import { SEED_LEADS } from '../utils/data';
import { Lead } from '../types';

export default function LeadDetailScreen({ route, navigation }: any) {
  const { leadId } = route.params;
  const lead = SEED_LEADS.find((l) => l.id === leadId);

  if (!lead) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: EVA.surface }}>
        <AppBar
          title="Lead"
          left={
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="chevL" size={20} color={EVA.muted} />
            </TouchableOpacity>
          }
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: EVA.muted }}>Lead not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: EVA.surface }}>
      <ScrollView style={{ flex: 1 }}>
        <AppBar
          title={lead.name}
          sub={lead.role}
          left={
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="chevL" size={20} color={EVA.muted} />
            </TouchableOpacity>
          }
          right={
            <TouchableOpacity>
              <Icon name="edit" size={20} color={EVA.green} />
            </TouchableOpacity>
          }
        />

        <View style={styles.container}>
          {/* Score Section */}
          <Card>
            <View style={styles.scoreSection}>
              <View>
                <Text style={styles.scoreLabel}>Lead Score</Text>
                <Text style={styles.scoreValue}>{lead.score}</Text>
              </View>
              <View style={styles.scoreDetails}>
                {Object.entries(lead.scoreBreak).map(([key, value]) => (
                  <View key={key} style={styles.scoreDetail}>
                    <Text style={styles.scoreDetailLabel}>{key}</Text>
                    <Text style={styles.scoreDetailValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          {/* Contact Info */}
          <Card>
            <Text style={styles.cardTitle}>Contact Information</Text>
            <View style={styles.infoRow}>
              <Icon name="mail" size={16} color={EVA.green} />
              <Text style={styles.infoText}>{lead.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="phone" size={16} color={EVA.green} />
              <Text style={styles.infoText}>{lead.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="building" size={16} color={EVA.green} />
              <Text style={styles.infoText}>{lead.company}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="map" size={16} color={EVA.green} />
              <Text style={styles.infoText}>{lead.location}</Text>
            </View>
          </Card>

          {/* Tags */}
          {lead.tags.length > 0 && (
            <Card>
              <Text style={styles.cardTitle}>Tags</Text>
              <View style={styles.tagsRow}>
                {lead.tags.map((tag) => (
                  <Chip key={tag} label={tag} />
                ))}
              </View>
            </Card>
          )}

          {/* Note */}
          {lead.note && (
            <Card>
              <Text style={styles.cardTitle}>Notes</Text>
              <Text style={styles.noteText}>{lead.note}</Text>
            </Card>
          )}

          {/* Activity */}
          {lead.activity.length > 0 && (
            <Card>
              <Text style={styles.cardTitle}>Activity</Text>
              {lead.activity.map((activity, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.activityItem,
                    idx !== lead.activity.length - 1 && styles.activityItemBorder,
                  ]}
                >
                  <View style={styles.activityIcon}>
                    <Icon name={activity.k} size={14} color={EVA.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityText}>{activity.text}</Text>
                    <Text style={styles.activityTime}>{activity.t}</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]}>
              <Icon name="phone" size={16} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
              <Icon name="mail" size={16} color={EVA.green} />
              <Text style={[styles.actionButtonText, { color: EVA.green }]}>Email</Text>
            </TouchableOpacity>
          </View>
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
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: EVA.muted,
    fontWeight: '500',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: EVA.green,
  },
  scoreDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 12,
    flex: 1,
  },
  scoreDetail: {
    alignItems: 'center',
  },
  scoreDetailLabel: {
    fontSize: 10,
    color: EVA.muted,
  },
  scoreDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: EVA.ink,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: EVA.ink,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: EVA.body,
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noteText: {
    fontSize: 13,
    color: EVA.body,
    lineHeight: 20,
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonPrimary: {
    backgroundColor: EVA.green,
  },
  actionButtonSecondary: {
    backgroundColor: EVA.greenSoft,
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 13,
  },
});
