import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { EVA } from '../utils/theme';
import { Icon, AppBar } from '../components/ui';

export default function ScanScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  React.useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (!cameraRef.current || isTakingPhoto) return;

    try {
      setIsTakingPhoto(true);
      const photo = await cameraRef.current.takePictureAsync();
      // In a real app, you'd process this image with OCR
      Alert.alert('Success', 'Card captured! Processing...', [
        { text: 'Continue', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
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
          type={cameraType}
          style={styles.camera}
          facing="back"
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
                setCameraType((t) => (t === 'back' ? 'front' : 'back'))
              }
            >
              <Icon name="refresh" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={isTakingPhoto}
            >
              <View style={styles.captureInner} />
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
    inset: 0,
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
