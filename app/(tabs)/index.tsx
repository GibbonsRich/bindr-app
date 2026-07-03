import { Link } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import AppHeading from '@/components/AppHeading';
import PageHeader from '@/components/PageHeader';
import { Text, View } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';

const FEATURES = [
  {
    title: 'Search cards',
    description:
      'Browse the Pokemon TCG catalog, check estimated prices, and add cards straight to your wishlist.',
    href: '/search' as const,
    cta: 'Search catalog',
  },
  {
    title: 'Scan cards',
    description:
      'Use your phone camera to scan a Pokemon card. Bindr grades condition, estimates value, and lets you save the card to your collection.',
    href: '/scan' as const,
    cta: 'Try scan',
  },
  {
    title: 'Track your portfolio',
    description:
      'Build a digital collection of every card you own. See estimated total value, condition grades, and manage copies in one place.',
    href: '/portfolio' as const,
    cta: 'View portfolio',
  },
  {
    title: 'Trade with collectors',
    description:
      'Cross-reference your wishlist with nearby collectors. Find who has the cards you want and compare prices before you trade or buy.',
    href: '/match' as const,
    cta: 'Find trades',
  },
  {
    title: 'Your profile',
    description:
      'See collection stats, wishlist count, and preferences like display currency — all in one place.',
    href: '/profile' as const,
    cta: 'View profile',
  },
];

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PageHeader
        title="Bindr"
        tagline="what's in your bindr?"
        description="Your Pokemon TCG companion. Scan cards, track your collection, and find trades with nearby collectors."
      />

      <AppHeading style={styles.sectionTitle}>What you can do</AppHeading>

      {FEATURES.map((feature) => (
        <View key={feature.title} style={styles.card} lightColor={Colors.light.surface} darkColor={Colors.dark.surface}>
          <AppHeading style={styles.cardTitle}>{feature.title}</AppHeading>
          <Text style={styles.cardBody}>{feature.description}</Text>
          <Link href={feature.href} style={styles.link}>
            <Text style={styles.linkText}>{feature.cta} →</Text>
          </Link>
        </View>
      ))}

      <View style={styles.footer} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
        <Text style={styles.footerText}>
          Prototype demo — scan uses sample data. Portfolio and trade features use local storage and
          demo collector listings.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  sectionTitle: {
    marginBottom: 14,
  },
  card: {
    borderRadius: 16,
    marginBottom: 14,
    padding: 18,
  },
  cardTitle: {
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.75,
  },
  link: {
    marginTop: 12,
  },
  linkText: {
    color: Pokemon.blue,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    borderRadius: 12,
    marginTop: 10,
    padding: 14,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.85,
    textAlign: 'center',
  },
});
