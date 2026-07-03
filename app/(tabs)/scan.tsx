import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import ConditionBadge from '@/components/ConditionBadge';
import CardImage from '@/components/CardImage';
import PageHeader from '@/components/PageHeader';
import ScreenNotifications from '@/components/ScreenNotifications';
import { Text, View } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';
import { useCurrency } from '@/hooks/useCurrency';
import { showAlert } from '@/lib/alert';
import { analyzeCardImage, ScanAnalysisError } from '@/lib/cardAi';
import { createScanPreviewId, setScanPreviewCard } from '@/lib/scanPreview';
import { addToPortfolio } from '@/lib/storage';
import type { PokemonCard, ScanResult } from '@/types/card';

type ScanSide = 'front' | 'back';

export default function ScanScreen() {
  const router = useRouter();
  const { formatMoney } = useCurrency();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanSide, setScanSide] = useState<ScanSide>('front');
  const [cameraReady, setCameraReady] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [backImageUri, setBackImageUri] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isWeb = Platform.OS === 'web';

  const hasFront = Boolean(result?.card.imageUri);
  const hasBack = Boolean(result?.card.backImageUri ?? backImageUri);

  function resetScanSession() {
    setResult(null);
    setBackImageUri(null);
    setPreviewId(null);
  }

  function attachBackUri(uri: string) {
    setBackImageUri(uri);
    setResult((current) =>
      current
        ? {
            ...current,
            card: { ...current.card, backImageUri: uri },
          }
        : current
    );
  }

  async function scanFrontFromUri(uri: string) {
    setScanning(true);
    const preservedBack = backImageUri ?? result?.card.backImageUri ?? null;
    setPreviewId(null);

    try {
      const analysis = await analyzeCardImage(uri);
      setResult({
        ...analysis,
        card: {
          ...analysis.card,
          imageUri: uri,
          backImageUri: preservedBack ?? undefined,
        },
      });
      if (preservedBack) setBackImageUri(preservedBack);
      else setBackImageUri(null);
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

  async function scanBackFromUri(uri: string) {
    setScanning(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      attachBackUri(uri);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not save the back photo. Try again.';
      showAlert('Scan failed', message);
    } finally {
      setScanning(false);
    }
  }

  async function capturePhoto(): Promise<string> {
    if (!cameraRef.current) {
      throw new Error('Wait for the camera preview to load, then try again.');
    }

    if (!cameraReady) {
      throw new Error('Wait a moment for the camera to initialize.');
    }

    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: isWeb });
    if (!photo?.uri) throw new Error('No photo captured');
    return photo.uri;
  }

  async function handleScanFront() {
    if (scanning) return;

    setScanSide('front');

    try {
      const uri = await capturePhoto();
      await scanFrontFromUri(uri);
    } catch (error) {
      const message =
        error instanceof ScanAnalysisError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not capture or analyze the card. Try again with better lighting.';
      showAlert('Scan failed', message);
      setScanning(false);
    }
  }

  async function handleScanBack() {
    if (scanning) return;

    setScanSide('back');
    setScanning(true);

    try {
      const uri = await capturePhoto();
      await scanBackFromUri(uri);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not capture the back photo. Try again with better lighting.';
      showAlert('Scan failed', message);
    } finally {
      setScanning(false);
    }
  }

  function buildPreviewCard(scanResult: ScanResult, id: string): PokemonCard {
    return {
      ...scanResult.card,
      id,
      quantity: 1,
      addedAt: new Date().toISOString(),
      source: 'scan',
      backImageUri: scanResult.card.backImageUri ?? backImageUri ?? undefined,
    };
  }

  function openScanDetail() {
    if (!result) return;

    const id = previewId ?? createScanPreviewId();
    setScanPreviewCard(id, buildPreviewCard(result, id));
    if (!previewId) setPreviewId(id);

    router.push({
      pathname: '/portfolio/[id]',
      params: { id, from: 'scan' },
    });
  }

  async function handleAddToPortfolio() {
    if (!result) return;

    setSaving(true);
    try {
      await addToPortfolio(buildPreviewCard(result, `card-${Date.now()}`));
      showAlert('Added', `${result.card.name} was added to your portfolio.`);
      resetScanSession();
      setBackImageUri(null);
    } finally {
      setSaving(false);
    }
  }

  if (!permission) {
    return (
      <ScreenNotifications>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Pokemon.red} />
        </View>
      </ScreenNotifications>
    );
  }

  if (!permission.granted) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <PageHeader
          title="Scan"
          description="Photograph the front and back of a Pokemon card to grade its condition and estimate value."
        />
        <View style={styles.centeredContent}>
          <Text style={styles.title}>Camera access needed</Text>
          <Text style={styles.permissionHint}>
            Allow camera access to scan the front and back of your cards.
          </Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Grant permission</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const scanDisabled = scanning || !cameraReady;
  const overlayText = scanning
    ? scanSide === 'front'
      ? 'Analyzing front…'
      : 'Capturing back…'
    : !cameraReady
      ? 'Starting camera…'
      : scanSide === 'front'
        ? 'Align the front of your card'
        : 'Flip the card and align the back';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PageHeader
        title="Scan"
        description="Scan the front to identify and grade your card, then scan the back to save both sides."
      />

      <View style={styles.demoBox} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
        <Text style={styles.demoText}>Prototype demo — card ID uses sample Pokemon data</Text>
      </View>

      <View style={styles.scanStatusRow} lightColor="transparent" darkColor="transparent">
        <ScanStatusChip label="Front" captured={hasFront} active={scanSide === 'front'} />
        <ScanStatusChip label="Back" captured={hasBack} active={scanSide === 'back'} />
      </View>

      <View style={styles.cameraFrame} lightColor="#000" darkColor="#000">
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />
        {scanning || !cameraReady ? (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.overlayText}>{overlayText}</Text>
          </View>
        ) : (
          <View style={styles.cameraHint}>
            <Text style={styles.cameraHintText}>{overlayText}</Text>
          </View>
        )}
      </View>

      <View style={styles.scanActions}>
        <Pressable
          style={[styles.primaryButton, styles.scanActionButton, scanDisabled && styles.disabled]}
          onPress={handleScanFront}
          disabled={scanDisabled}>
          <Text style={styles.primaryButtonText}>
            {scanning && scanSide === 'front' ? 'Scanning front…' : 'Scan front of card'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.outlineButton, styles.scanActionButton, scanDisabled && styles.disabled]}
          onPress={handleScanBack}
          disabled={scanDisabled}>
          <Text style={styles.outlineButtonText}>
            {scanning && scanSide === 'back' ? 'Scanning back…' : 'Scan back of card'}
          </Text>
        </Pressable>
      </View>

      {!hasFront && hasBack ? (
        <View style={styles.pendingBack} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
          <Text style={styles.pendingBackText}>Back photo saved — scan the front to identify this card.</Text>
        </View>
      ) : null}

      {result ? (
        <View style={styles.resultWrap}>
          <View style={styles.previewPhotos} lightColor="transparent" darkColor="transparent">
            <MiniPhoto label="Front" captured={hasFront} />
            <MiniPhoto label="Back" captured={hasBack} />
          </View>

          <Pressable
            onPress={openScanDetail}
            style={({ pressed }) => [pressed && styles.resultPressed]}
            accessibilityRole="button"
            accessibilityLabel={`View details for ${result.card.name}`}>
            <View
              style={styles.resultCard}
              lightColor={Colors.light.surface}
              darkColor={Colors.dark.surface}>
              <CardImage
                name={result.card.name}
                set={result.card.set}
                imageUri={result.card.imageUri}
                backImageUri={result.card.backImageUri ?? backImageUri ?? undefined}
                size="lg"
              />
              <Text style={styles.resultTitle}>{result.card.name}</Text>
              <Text style={styles.resultMeta}>
                {result.card.set} · #{result.card.number} · {result.card.rarity}
              </Text>
              <Text style={styles.confidence}>Confidence: {Math.round(result.confidence * 100)}%</Text>

              <View style={styles.gradeRow}>
                <ConditionBadge condition={result.card.condition} />
                <Text style={styles.value}>Est. {formatMoney(result.card.estimatedValue)}</Text>
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

              <Text style={styles.tapHint}>Tap for full details →</Text>
            </View>
          </Pressable>

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

function ScanStatusChip({
  label,
  captured,
  active,
}: {
  label: string;
  captured: boolean;
  active: boolean;
}) {
  return (
    <View
      style={[styles.statusChip, active && styles.statusChipActive, captured && styles.statusChipDone]}
      lightColor={captured ? Colors.light.surfaceAlt : Colors.light.surface}
      darkColor={captured ? Colors.dark.surfaceAlt : Colors.dark.surface}>
      <Text style={styles.statusChipText}>
        {label} {captured ? '✓' : active ? '•' : ''}
      </Text>
    </View>
  );
}

function MiniPhoto({ label, captured }: { label: string; captured: boolean }) {
  return (
    <View style={styles.miniPhoto} lightColor={Colors.light.surface} darkColor={Colors.dark.surface}>
      <Text style={styles.miniPhotoLabel}>{label}</Text>
      <Text style={styles.miniPhotoState}>{captured ? 'Captured' : 'Missing'}</Text>
    </View>
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
    paddingTop: 16,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  centeredContent: {
    alignItems: 'center',
    paddingTop: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionHint: {
    fontSize: 14,
    marginBottom: 20,
    opacity: 0.7,
    textAlign: 'center',
  },
  demoBox: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
  },
  demoText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
    textAlign: 'center',
  },
  scanStatusRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statusChip: {
    borderRadius: 999,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusChipActive: {
    borderColor: Pokemon.blue,
    borderWidth: 2,
  },
  statusChipDone: {
    borderColor: Pokemon.gbLight,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  cameraFrame: {
    borderRadius: 20,
    height: 320,
    marginBottom: 14,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
  },
  overlayText: {
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
  },
  cameraHint: {
    bottom: 12,
    left: 12,
    position: 'absolute',
    right: 12,
  },
  cameraHintText: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center',
  },
  scanActions: {
    gap: 10,
  },
  scanActionButton: {
    marginTop: 0,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Pokemon.red,
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
    backgroundColor: Pokemon.blue,
    borderRadius: 12,
    marginTop: 12,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  outlineButton: {
    alignItems: 'center',
    borderColor: Pokemon.blue,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 12,
    paddingVertical: 12,
  },
  outlineButtonText: {
    color: Pokemon.blue,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  pendingBack: {
    borderRadius: 12,
    marginTop: 14,
    padding: 12,
  },
  pendingBackText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  resultWrap: {
    marginTop: 20,
  },
  previewPhotos: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  miniPhoto: {
    borderRadius: 12,
    flex: 1,
    padding: 12,
  },
  miniPhotoLabel: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.65,
  },
  miniPhotoState: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  resultCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
  },
  resultPressed: {
    opacity: 0.92,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  resultMeta: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.7,
    textAlign: 'center',
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
  tapHint: {
    color: Pokemon.blue,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
  },
});
