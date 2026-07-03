import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import ConditionBadge from '@/components/ConditionBadge';
import { Text, View } from '@/components/Themed';
import { analyzeCardImage, ScanAnalysisError } from '@/lib/cardAi';
import { getMissingApiKeyMessage, getVisionProvider } from '@/lib/config';
import { addToPortfolio } from '@/lib/storage';
import type { ScanResult } from '@/types/card';

export default function ScanScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [saving, setSaving] = useState(false);
  const hasVisionKey = Boolean(getVisionProvider());

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
      </View>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || scanning) return;

    setScanning(true);
    setResult(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new Error('No photo captured');

      const analysis = await analyzeCardImage(photo.uri);
      setResult(analysis);
    } catch (error) {
      const message =
        error instanceof ScanAnalysisError
          ? error.message
          : 'Could not capture or analyze the card. Try again with better lighting.';
      Alert.alert('Scan failed', message);
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
      Alert.alert('Added', `${result.card.name} was added to your portfolio.`);
      setResult(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>AI Card Scan</Text>
      <Text style={styles.subtitle}>
        Point your camera at a card and tap Scan. AI reads the card identity and grades visible
        condition from the photo.
      </Text>

      {!hasVisionKey ? (
        <View style={styles.warningBox} lightColor="#fff7ed" darkColor="#422006">
          <Text style={styles.warningTitle}>API key required</Text>
          <Text style={styles.warningText}>{getMissingApiKeyMessage()}</Text>
        </View>
      ) : null}

      <View style={styles.cameraFrame} lightColor="#000" darkColor="#000">
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        {scanning ? (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.overlayText}>Analyzing card…</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        style={[styles.primaryButton, (scanning || !hasVisionKey) && styles.disabled]}
        onPress={handleCapture}
        disabled={scanning || !hasVisionKey}>
        <Text style={styles.primaryButtonText}>{scanning ? 'Scanning…' : 'Scan card'}</Text>
      </Pressable>

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
  warningBox: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 14,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
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
    marginTop: 16,
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
