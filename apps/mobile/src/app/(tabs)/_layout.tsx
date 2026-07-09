import { Tabs } from "expo-router";
import { Text } from "react-native";

// Tokens Arena (dupliqués ici : la config native de la tab bar ne passe pas par NativeWind).
const ARENA = {
  bg: "#0C0E11",
  surf: "#15181D",
  line: "#282E36",
  acid: "#1FB2FF",
  ghost: "#6B747D",
};

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{icon}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ARENA.acid,
        tabBarInactiveTintColor: ARENA.ghost,
        tabBarStyle: {
          backgroundColor: ARENA.surf,
          borderTopColor: ARENA.line,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ focused }) => <TabIcon icon="⌂" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="programme"
        options={{
          title: "Programme",
          tabBarIcon: ({ focused }) => <TabIcon icon="🏋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progres"
        options={{
          title: "Progrès",
          tabBarIcon: ({ focused }) => <TabIcon icon="📈" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
