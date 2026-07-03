import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import ConditionBadge from '@/components/ConditionBadge';
import { Text, View } from '@/components/Themed';
import { showAlert } from '@/lib/alert';
import { analyzeCardImage, ScanAnalysisError } from '@/lib/cardAi';
import { addToPortfolio } from '@/lib/storage';
import type { ScanResult } from '@/types/card';

export default function ScanScreen() {
  const cameraRef = useRef<CameraView>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [saving, setSaving] = useState(false);
  const isWeb = Platform.OS === 'web';

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const uri = URL.createObjectURL(file);
    try {
      await analyzeFromUri(uri);
    } finally {
      URL.revokeObjectURL(uri);
    }
  }

  function renderWebFileInput() {
    if (!isWeb) return null;

    return (
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />
    );
  }

  async function analyzeFromUri(uri: string) {
    setScanning(true);
    setResult(null);

    try {
      const analysis = await analyzeCardImage(uri);
      setResult(analysis);
    } catch (error) {
      const message =
        error instanceof ScanAnalysisError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not analyze the card. Try again with better lighting.';
      showAlert('Scan failed', message);
    } finally {
      setScanning(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E3350D" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.subtitle}>
          Bindr uses your camera to scan Pokemon cards and estimate their condition.
        </Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant permission</Text>
        </Pressable>
        {isWeb ? (
          <Pressable style={styles.secondaryButton} onPress={openFilePicker}>
            <Text style={styles.secondaryButtonText}>Choose photo instead</Text>
          </Pressable>
        ) : null}
        {renderWebFileInput()}
      </View>
    );
  }

  async function handleCapture() {
    if (scanning) return;

    if (!cameraRef.current) {
      showAlert('Camera not ready', 'Wait for the camera preview to load, then try again.');
      return;
    }

    if (!cameraReady) {
      showAlert('Camera not ready', 'Wait a moment for the camera to initialize.');
      return;
    }

    setScanning(true);
    setResult(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: isWeb });
      if (!photo?.uri) throw new Error('No photo captured');

      const analysis = await analyzeCardImage(photo.uri);
      setResult(analysis);
    } catch (error) {
      const message =
        error instanceof ScanAnalysisError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not capture or analyze the card. Try again with better lighting.';
      showAlert('Scan failed', message);
    } finally {
      setScanning(false);
    }
  }

  async function handleAddToPortfolio() {
    if (!result) return;

    setSaving(true);
    try {
      await addToPortfolio({
        ...result.card,
        id: `card-${Date.now()}`,
        quantity: 1,
        addedAt: new Date().toISOString(),
        source: 'scan',
      });
      showAlert('Added', `${result.card.name} was added to your portfolio.`);
      setResult(null);
    } finally {
      setSaving(false);
    }
  }

  const scanDisabled = scanning || !cameraReady;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>AI Card Scan</Text>
      <Text style={styles.subtitle}>
        Point your camera at a card and tap Scan. Demo mode uses sample data — no API keys needed.
      </Text>

      <View style={styles.demoBox} lightColor="#eff6ff" darkColor="#1e3a5f">
        <Text style={styles.demoText}>Prototype demo — scan results are sample Pokemon card data</Text>
      </View>

      <View style={styles.cameraFrame} lightColor="#000" darkColor="#000">
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />
        {scanning ? (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.overlayText}>Analyzing card…</Text>
          </View>
        ) : null}
        {!cameraReady && !scanning ? (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.overlayText}>Starting camera…</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        style={[styles.primaryButton, scanDisabled && styles.disabled]}
        onPress={handleCapture}
        disabled={scanDisabled}>
        <Text style={styles.primaryButtonText}>
          {scanning ? 'Scanning…' : cameraReady ? 'Scan card' : 'Waiting for camera…'}
        </Text>
      </Pressable>

      {isWeb ? (
        <Pressable
          style={[styles.secondaryButton, scanning && styles.disabled]}
          onPress={openFilePicker}
          disabled={scanning}>
          <Text style={styles.secondaryButtonText}>Choose photo from library</Text>
        </Pressable>
      ) : null}

      {renderWebFileInput()}

      {result ? (
        <View style={styles.resultCard} lightColor="#fef2f2" darkColor="#1f2937">
          <Text style={styles.resultTitle}>{result.card.name}</Text>
          <Text style={styles.resultMeta}>
            {result.card.set} · #{result.card.number} · {result.card.rarity}
          </Text>
          <Text style={styles.confidence}>Confidence: {Math.round(result.confidence * 100)}%</Text>

          <View style={styles.gradeRow}>
            <ConditionBadge condition={result.card.condition} />
            <Text style={styles.value}>Est. ${result.card.estimatedValue}</Text>
          </View>

          {result.card.grade ? (
            <View style={styles.gradeGrid}>
              <GradeStat label="Centering" value={result.card.grade.centering} />
              <GradeStat label="Corners" value={result.card.grade.corners} />
              <GradeStat label="Edges" value={result.card.grade.edges} />
              <GradeStat label="Surface" value={result.card.grade.surface} />
            </View>
          ) : null}

          {result.card.grade?.notes.map((note) => (
            <Text key={note} style={styles.note}>
              • {note}
            </Text>
          ))}

          <Pressable
            style={[styles.secondaryButton, saving && styles.disabled]}
            onPress={handleAddToPortfolio}
            disabled={saving}>
            <Text style={styles.secondaryButtonText}>
              {saving ? 'Saving…' : 'Add to portfolio'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

function GradeStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.gradeStat} lightColor="transparent" darkColor="transparent">
      <Text style={styles.gradeLabel}>{label}</Text>
      <Text style={styles.gradeValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    marginTop: 6,
    opacity: 0.7,
    textAlign: 'center',
  },
  demoBox: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
  },
  demoText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
    textAlign: 'center',
  },
  cameraFrame: {
    borderRadius: 20,
    height: 320,
    marginBottom: 16,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
  },
  overlayText: {
    color: '#fff',
    marginTop: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#E3350D',
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#E3350D',
    borderRadius: 12,
    marginTop: 12,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  resultCard: {
    borderRadius: 16,
    marginTop: 20,
    padding: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  resultMeta: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.7,
  },
  confidence: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.6,
  },
  gradeRow: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  gradeGrid: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  gradeStat: {
    minWidth: '42%',
  },
  gradeLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  gradeValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  note: {
    fontSize: 13,
    marginTop: 6,
    opacity: 0.8,
  },
});
