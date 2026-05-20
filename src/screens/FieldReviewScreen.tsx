import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { EVA } from '../utils/theme';
import { Icon, AppBar, Button, Card } from '../components/ui';
import { ExtractedCard } from '../utils/ocr';
import { Lead } from '../types';
import OCRService from '../utils/ocr';
import DuplicateService, { DuplicateCheck } from '../utils/duplicate';
import StorageService from '../utils/storage';

export default function FieldReviewScreen({ route, navigation }: any) {
  const { extracted, imageUri } = route.params as {
    extracted: ExtractedCard;
    imageUri: string;
  };

  const [lead, setLead] = useState<Lead>(
    OCRService.createLeadFromExtraction(extracted),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheck | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(false);

  // True when no text was extracted from the card at all
  const isManualEntry =
    !extracted.rawText || extracted.rawText.trim().length === 0;

  React.useEffect(() => {
    checkForDuplicates();
  }, []);

  const checkForDuplicates = async () => {
    setIsChecking(true);
    try {
      const existingLeads = await StorageService.getLeads();
      const check = DuplicateService.checkDuplicate(lead, existingLeads);
      setDuplicateCheck(check);
    } catch (error) {
      console.error('Error checking duplicates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const updateField = (field: keyof Lead, value: string) => {
    setLead(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    // If exact duplicate, don't save
    if (duplicateCheck?.type === 'exact') {
      Alert.alert(
        'Duplicate Found',
        `This card matches "${duplicateCheck.existing?.name}" already in your list.`,
        [
          {
            text: 'View Existing',
            onPress: () => {
              navigation.navigate('LeadDetail', { lead: duplicateCheck.existing });
            },
          },
          { text: 'Back', style: 'cancel' },
        ],
      );
      return;
    }

    // If possible duplicate, ask user
    if (duplicateCheck?.type === 'possible') {
      Alert.alert(
        'Possible Duplicate',
        `Found similar card: "${duplicateCheck.existing?.name}". Merge or create new?`,
        [
          {
            text: 'Merge',
            onPress: handleMerge,
          },
          {
            text: 'Create New',
            onPress: handleCreateNew,
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    // No duplicate, save new lead
    await handleCreateNew();
  };

  const handleCreateNew = async () => {
    setIsSaving(true);
    try {
      await StorageService.saveLead(lead);
      Alert.alert('Success', 'Lead saved successfully!', [
        {
          text: 'View',
          onPress: () => {
            navigation.navigate('LeadDetail', { lead });
          },
        },
        {
          text: 'Done',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          },
          style: 'default',
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save lead');
      console.error('Error saving lead:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMerge = async () => {
    if (!duplicateCheck?.existing) return;

    setIsSaving(true);
    try {
      // Merge the new data into existing lead
      const merged = {
        ...lead,
        id: duplicateCheck.existing.id, // Keep existing ID
      };
      await StorageService.mergeLead(duplicateCheck.existing.id, merged);
      Alert.alert('Success', 'Lead updated successfully!', [
        {
          text: 'View',
          onPress: () => {
            navigation.navigate('LeadDetail', { lead: merged });
          },
        },
        {
          text: 'Done',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          },
          style: 'default',
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to merge lead');
      console.error('Error merging lead:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return EVA.green;
    if (confidence >= 0.8) return EVA.orange;
    return EVA.red;
  };

  const renderField = (
    label: string,
    fieldKey: keyof Lead,
    confidence: number,
  ) => {
    const value = String(lead[fieldKey] || '');
    const isConfident = confidence >= 0.85;
    const showConfidence = confidence > 0; // hide badge when OCR had no data

    return (
      <View key={fieldKey} style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>{label}</Text>
          {showConfidence && (
            <View style={styles.confidenceRow}>
              <View
                style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(confidence) },
                ]}
              >
                <Text style={styles.confidenceText}>
                  {Math.round(confidence * 100)}%
                </Text>
              </View>
              {!isConfident && (
                <Icon name="alert-circle" size={16} color={EVA.orange} />
              )}
            </View>
          )}
        </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={text => updateField(fieldKey, text)}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={EVA.greyText}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: EVA.bgColor }}>
      <AppBar
        title="Review & Edit"
        sub="Confirm extracted information"
        left={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color={EVA.greenInk} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.container}>
        {/* Manual entry banner */}
        {isManualEntry && (
          <Card style={[styles.statusCard, { backgroundColor: EVA.green + '15' }]}>
            <Icon name="camera" size={20} color={EVA.green} />
            <Text style={[styles.statusText, { color: EVA.green, marginLeft: 8 }]}>
              Card captured! Fill in the details below.
            </Text>
          </Card>
        )}

        {/* Duplicate Status */}
        {isChecking && (
          <Card style={styles.statusCard}>
            <ActivityIndicator
              size="small"
              color={EVA.green}
              style={{ marginRight: 12 }}
            />
            <Text style={styles.statusText}>Checking for duplicates...</Text>
          </Card>
        )}

        {duplicateCheck && !isChecking && (
          <View>
            {duplicateCheck.type === 'exact' && (
              <Card style={[styles.statusCard, { backgroundColor: EVA.red + '15' }]}>
                <Icon name="check-circle" size={20} color={EVA.red} />
                <Text style={[styles.statusText, { color: EVA.red, marginLeft: 8 }]}>
                  Exact match found: {duplicateCheck.existing?.name}
                </Text>
              </Card>
            )}
            {duplicateCheck.type === 'possible' && (
              <Card style={[styles.statusCard, { backgroundColor: EVA.orange + '15' }]}>
                <Icon name="alert-circle" size={20} color={EVA.orange} />
                <Text style={[styles.statusText, { color: EVA.orange, marginLeft: 8 }]}>
                  Possible duplicate: {duplicateCheck.existing?.name}
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Score Overview */}
        <Card style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>{lead.score}</Text>
            </View>
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreLabel}>Quality Score</Text>
              <Text style={styles.scoreDescription}>
                {lead.score >= 85 ? 'Excellent extraction' : 'Good extraction'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Editable Fields */}
        <Card style={styles.fieldsCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          {renderField(
            'Name',
            'name',
            extracted.confidence.name,
          )}
          {renderField(
            'Role',
            'role',
            extracted.confidence.role,
          )}
          {renderField(
            'Company',
            'company',
            extracted.confidence.company,
          )}
          {renderField(
            'Email',
            'email',
            extracted.confidence.email,
          )}
          {renderField(
            'Phone',
            'phone',
            extracted.confidence.phone,
          )}
          {renderField(
            'Location',
            'location',
            extracted.confidence.location,
          )}

          {/* Note field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={lead.note}
              onChangeText={text => updateField('note', text)}
              placeholder="Add any notes about this contact"
              placeholderTextColor={EVA.greyText}
              multiline
              numberOfLines={3}
            />
          </View>
        </Card>

        {/* Save Button */}
        <View style={styles.actionContainer}>
          <Button
            title={isSaving ? 'Saving...' : 'Save Lead'}
            onPress={handleSave}
            disabled={isSaving || isChecking}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  statusText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: EVA.text,
  },
  scoreCard: {
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: EVA.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreDetails: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: EVA.text,
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 12,
    color: EVA.greyText,
  },
  fieldsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: EVA.text,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: EVA.text,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: EVA.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: EVA.text,
    backgroundColor: '#fff',
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionContainer: {
    paddingVertical: 16,
    gap: 8,
  },
});
