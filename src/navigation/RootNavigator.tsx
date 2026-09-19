import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Bot, Wallet, SlidersHorizontal } from 'lucide-react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';

export type RootTabParamList = {
  Dashboard: undefined;
  Chat: undefined;
  Accounts: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.emeraldGreen,
        tabBarInactiveTintColor: Colors.slateGray,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Home size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: 'AI Assistant',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Bot size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{
          tabBarLabel: 'Accounts',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Wallet size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <SlidersHorizontal size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  iconWrapperActive: {
    transform: [{ scale: 1.08 }],
  },
});
