import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import AppHeading from '@/components/AppHeading';
import CardGradePanel from '@/components/CardGradePanel';
import CardImage from '@/components/CardImage';
import ConditionBadge from '@/components/ConditionBadge';
import PageHeader from '@/components/PageHeader';
import ScreenNotifications from '@/components/ScreenNotifications';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useCurrency } from '@/hooks/useCurrency';
import { showAlert, showSuccess } from '@/lib/alert';
import { analyzeCardImage, ScanAnalysisError } from '@/lib/cardAi';
import { createScanPreviewId, setScanPreviewCard } from '@/lib/scanPreview';
import { addToPortfolio } from '@/lib/storage';
import type { PokemonCard, ScanResult } from '@/types/card';

type ScanSide = 'front' | 'back';
type ScanStep = 'front' | 'back' | 'done';

export default function ScanScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const { formatMoney } = useCurrency();
  const cameraRef = useRef<CameraView>(null);
  const preserveSessionRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState<ScanStep>('front');
  const [scanSide, setScanSide] = useState<ScanSide>('front');
  const [cameraReady, setCameraReady] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [backImageUri, setBackImageUri] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isWeb = Platform.OS === 'web';

  const hasFront = scanStep !== 'front';
  const hasBack = scanStep === 'done';

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (preserveSessionRef.current) {
          preserveSessionRef.current = false;
          return;
        }

        setScanning(false);
        setScanStep('front');
        setScanSide('front');
        setResult(null);
        setBackImageUri(null);
        setPreviewId(null);
      };
    }, [])
  );

  function resetScanSession() {
    setScanning(false);
    setScanStep('front');
    setScanSide('front');
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
    setPreviewId(null);
    setBackImageUri(null);

    try {
      const analysis = await analyzeCardImage(uri);
      setResult({
        ...analysis,
        card: {
          ...analysis.card,
          imageUri: uri,
        },
      });
    } catch (error) {
      const message =
        error instanceof ScanAnalysisError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not analyze the card. Try again with better lighting.';
      showAlert('Scan failed', message);
      throw error;
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
      throw error;
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

  async function handleScan() {
    if (scanning || scanStep === 'done') return;

    const side: ScanSide = scanStep === 'front' ? 'front' : 'back';
    setScanSide(side);

    try {
      const uri = await capturePhoto();

      if (scanStep === 'front') {
        await scanFrontFromUri(uri);
        setScanStep('back');
        setScanSide('back');
      } else {
        await scanBackFromUri(uri);
        setScanStep('done');
      }
    } catch (error) {
      const message =
        error instanceof ScanAnalysisError
          ? error.message
          : error instanceof Error
            ? error.message
            : scanStep === 'front'
              ? 'Could not capture or analyze the card. Try again with better lighting.'
              : 'Could not capture the back photo. Try again with better lighting.';
      showAlert('Scan failed', message);
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

    preserveSessionRef.current = true;
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
      showSuccess('Added', `${result.card.name} was added to your portfolio.`);
      resetScanSession();
    } finally {
      setSaving(false);
    }
  }

  if (!permission) {
    return (
      <ScreenNotifications>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.spinner} />
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
          <AppHeading style={styles.title}>Camera access needed</AppHeading>
          <Text style={styles.permissionHint}>
            Allow camera access to scan the front and back of your cards.
          </Text>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: theme.action }]}
            onPress={requestPermission}>
            <Text style={[styles.primaryButtonText, { color: theme.actionText }]}>
              Grant permission
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const scanDisabled = scanning || !cameraReady || scanStep === 'done';
  const overlayText = scanning
    ? scanSide === 'front'
      ? 'Analyzing front…'
      : 'Capturing back…'
    : !cameraReady
      ? 'Starting camera…'
      : scanStep === 'front'
        ? 'Step 1 — align the front of your card'
        : scanStep === 'back'
          ? 'Step 2 — flip the card and align the back'
          : 'Scan complete';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PageHeader
        title="Scan"
        description="Scan the front, then the back in order. Leaving this page resets the scan."
      />

      <View style={styles.demoBox} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
        <Text style={styles.demoText}>Prototype demo — card ID uses sample Pokemon data</Text>
      </View>

      <View style={styles.scanStatusRow} lightColor="transparent" darkColor="transparent">
        <ScanStatusChip label="1. Front" captured={hasFront} active={scanStep === 'front'} />
        <ScanStatusChip label="2. Back" captured={hasBack} active={scanStep === 'back'} />
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

      {scanStep !== 'done' ? (
        <Pressable
          style={[
            styles.primaryButton,
            { backgroundColor: theme.action },
            scanDisabled && styles.disabled,
          ]}
          onPress={handleScan}
          disabled={scanDisabled}>
          <Text style={[styles.primaryButtonText, { color: theme.actionText }]}>
            {scanning
              ? scanStep === 'front'
                ? 'Scanning front…'
                : 'Scanning back…'
              : scanStep === 'front'
                ? 'Scan front of card'
                : 'Scan back of card'}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.outlineButton, { borderColor: theme.border }]}
          onPress={resetScanSession}>
          <Text style={[styles.outlineButtonText, { color: theme.link }]}>Scan another card</Text>
        </Pressable>
      )}

      {scanStep === 'back' && result && !scanning ? (
        <View style={styles.pendingBack} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
          <Text style={styles.pendingBackText}>
            Front captured — {result.card.name}. Now scan the back to finish.
          </Text>
        </View>
      ) : null}

      {scanStep === 'done' && result ? (
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
              <AppHeading style={styles.resultTitle}>{result.card.name}</AppHeading>
              <Text style={styles.resultMeta}>
                {result.card.set} · #{result.card.number} · {result.card.rarity}
              </Text>
              <Text style={styles.confidence}>Confidence: {Math.round(result.confidence * 100)}%</Text>

              <View style={styles.gradeRow}>
                <ConditionBadge condition={result.card.condition} />
                <Text style={styles.value}>Est. {formatMoney(result.card.estimatedValue)}</Text>
              </View>

              {result.card.grade ? (
                <CardGradePanel grade={result.card.grade} />
              ) : null}

              <Text style={styles.tapHint}>Tap for full details →</Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButton,
              { backgroundColor: theme.action },
              saving && styles.disabled,
            ]}
            onPress={handleAddToPortfolio}
            disabled={saving}>
            <Text style={[styles.secondaryButtonText, { color: theme.actionText }]}>
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
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  return (
    <View
      style={[
        styles.statusChip,
        { borderColor: theme.border, borderWidth: captured || active ? 2 : 1 },
      ]}
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
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  primaryButton: {
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 12,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  outlineButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 12,
    paddingVertical: 12,
  },
  outlineButtonText: {
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
  tapHint: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
    opacity: 0.85,
  },
});
