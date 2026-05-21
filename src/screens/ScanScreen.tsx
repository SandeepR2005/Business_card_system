import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { EVA } from '../utils/theme';
import { Icon, AppBar } from '../components/ui';
import OCRService from '../utils/ocr';

export default function ScanScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (!cameraRef.current || isTakingPhoto || isProcessing) return;

    try {
      setIsTakingPhoto(true);
      // Request base64 from camera directly — avoids expo-file-system native module issues.
      // quality: 0.15 compresses the photo for efficient on-device processing.
      // Text remains perfectly readable for LEADTOOLS recognition at this quality.
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.15 });
      
      if (!photo?.uri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      if (!photo?.base64) {
        Alert.alert('Error', 'Could not read image data. Please try again.');
        return;
      }

      // Show processing indicator
      setIsProcessing(true);
      
      // Extract card data using LEADTOOLS OCR service (on-device)
      // This performs:
      // 1. Card detection & orientation correction
      // 2. Structured field extraction with confidence scores
      // 3. Full on-device processing — no data leaves the device
      const extracted = await OCRService.extractCard(photo.base64);
      
      setIsProcessing(false);

      // If no data was extracted, inform the user
      const hasAnyData =
        extracted.name || extracted.email || extracted.phone || extracted.company;
      if (!hasAnyData) {
        Alert.alert(
          'Card Captured',
          'Could not read text from this card. The image may be blurry, poorly lit, ' +
            'or at an odd angle. You can fill in the contact details manually.',
          [{
            text: 'Fill in Manually',
            onPress: () =>
              navigation.navigate('FieldReview', { extracted, imageUri: photo.uri }),
          }],
        );
        return;
      }

      // Card data extracted successfully
      // Show card quality indicator if available
      if (extracted.cardQuality) {
        const quality = Math.round(extracted.cardQuality * 100);
        console.log(`📊 Card extraction quality: ${quality}%`);
      }

      // Navigate to field review screen with extracted data
      navigation.navigate('FieldReview', {
        extracted,
        imageUri: photo.uri,
      });
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to process card. Please try again.');
      console.error('OCR Error:', error);
    } finally {
      setIsTakingPhoto(false);
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: EVA.greenInk }}>
        <AppBar
          title="Camera Permission"
          dark
          left={
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="close" size={20} color="#fff" />
            </TouchableOpacity>
          }
        />
        <View style={styles.permissionContainer}>
          <Icon name="camera" size={48} color={EVA.green} />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionDescription}>
            Please allow camera access to scan business cards
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: EVA.greenInk }}>
      <View style={styles.container}>
        <AppBar
          title="Scan Card"
          dark
          left={
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="close" size={20} color="#fff" />
            </TouchableOpacity>
          }
        />

        <CameraView
          ref={cameraRef}
          facing={facing}
          style={styles.camera}
        >
          {/* Camera Frame Overlay */}
          <View style={styles.overlay}>
            <View style={styles.frameContainer}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.hint}>Position card in frame</Text>
          </View>

          {/* Bottom Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() =>
                setFacing((f) => (f === 'back' ? 'front' : 'back'))
              }
              disabled={isTakingPhoto || isProcessing}
            >
              <Icon name="refresh" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={isTakingPhoto || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color={EVA.green} />
              ) : (
                <View style={styles.captureInner} />
              )}
            </TouchableOpacity>

            <View style={{ width: 56 }} />
          </View>
        </CameraView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EVA.greenInk,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameContainer: {
    width: 280,
    height: 180,
    position: 'relative',
    marginBottom: 60,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: EVA.green,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  hint: {
    position: 'absolute',
    bottom: -50,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 40,
    paddingHorizontal: 20,
    gap: 12,
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: EVA.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 20,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: EVA.green,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
