import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { StyleSheet, View as RNView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const TAB_BAR_HEIGHT = 68;

type TabIconName = {
  ios: string;
  android: string;
  web: string;
};

function TabIcon({ name, color }: { name: TabIconName; color: string }) {
  return (
    <RNView style={styles.tabIconWrap}>
      <SymbolView name={name} tintColor={color} size={24} />
    </RNView>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 6);
  const theme = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomOffset,
          left: 0,
          right: 0,
          height: TAB_BAR_HEIGHT,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
          overflow: 'visible',
          paddingTop: 0,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 3,
          paddingBottom: 0,
          height: TAB_BAR_HEIGHT,
        },
        tabBarIconStyle: {
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 3,
          marginBottom: 0,
          paddingBottom: 0,
          lineHeight: 13,
        },
        sceneStyle: {
          backgroundColor: theme.background,
          paddingBottom: bottomOffset + TAB_BAR_HEIGHT + 8,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <TabIcon
              name={{
                ios: 'house.fill',
                android: 'home',
                web: 'home',
              }}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => (
            <TabIcon
              name={{
                ios: 'magnifyingglass',
                android: 'search',
                web: 'search',
              }}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => (
            <TabIcon
              name={{
                ios: 'camera.viewfinder',
                android: 'camera',
                web: 'camera',
              }}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color }) => (
            <TabIcon
              name={{
                ios: 'chart.line.uptrend.xyaxis',
                android: 'trending_up',
                web: 'trending_up',
              }}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: 'Trade',
          tabBarIcon: ({ color }) => (
            <TabIcon
              name={{
                ios: 'location.fill',
                android: 'location_on',
                web: 'location_on',
              }}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon
              name={{
                ios: 'person.fill',
                android: 'person',
                web: 'person',
              }}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
});
