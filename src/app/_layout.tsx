import { Tabs } from 'expo-router/js-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { RaveCallProvider } from '@/state/RaveCallContext';
import { colors } from '@/components/ui';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function RootLayout() {
  return (
    <RaveCallProvider>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.cardBorder },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.muted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Join',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🎟️" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="concert"
          options={{
            title: 'Concert',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🎧" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="friends"
          options={{
            title: 'Friends',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🗣️" focused={focused} />,
          }}
        />
      </Tabs>
    </RaveCallProvider>
  );
}
