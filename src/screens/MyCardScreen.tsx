import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { EVA } from '../utils/theme';
import { AppBar, Icon, Card } from '../components/ui';
import { CURRENT_USER } from '../utils/data';

export default function MyCardScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: EVA.surface }}>
      <ScrollView style={{ flex: 1 }}>
        <AppBar
          title="My Card"
          dark={false}
          left={<Icon name="target" size={22} color={EVA.green} />}
        />

        <View style={styles.container}>
          {/* Business Card Preview */}
          <Card>
            <View style={styles.cardPreview}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardName}>{CURRENT_USER.name}</Text>
                <Text style={styles.cardRole}>{CURRENT_USER.role}</Text>
                <View style={{ marginTop: 12, gap: 6 }}>
                  <Text style={styles.cardDetail}>{CURRENT_USER.company}</Text>
                  <Text style={styles.cardDetail}>{CURRENT_USER.region}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <View style={styles.cardLogo}>
                  <Text style={{ fontSize: 32 }}>📱</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Contact Details */}
          <Card>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.detailRow}>
              <Icon name="mail" size={16} color={EVA.green} />
              <Text style={styles.detailText}>{CURRENT_USER.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="phone" size={16} color={EVA.green} />
              <Text style={styles.detailText}>{CURRENT_USER.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="building" size={16} color={EVA.green} />
              <Text style={styles.detailText}>{CURRENT_USER.company}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="map" size={16} color={EVA.green} />
              <Text style={styles.detailText}>{CURRENT_USER.region}</Text>
            </View>
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="download" size={16} color={EVA.green} />
              <Text style={styles.actionButtonText}>Share Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="edit" size={16} color={EVA.green} />
              <Text style={styles.actionButtonText}>Edit</Text>
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
  cardPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: EVA.greenInk,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: EVA.green,
  },
  cardLeft: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  cardRole: {
    fontSize: 12,
    color: EVA.green,
    fontWeight: '600',
  },
  cardDetail: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  cardRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: EVA.ink,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 13,
    color: EVA.body,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: EVA.greenSoft,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: EVA.green,
  },
});
