import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import { formatINR } from '../utils/currency';
import { PieChart, Utensils, Zap, Car, ShoppingBag, ShoppingCart, HeartPulse, Film } from 'lucide-react-native';

interface SpendingChartProps {
  categoryExpenses: Record<string, number>;
}

export const SpendingChart: React.FC<SpendingChartProps> = ({ categoryExpenses }) => {
  // Aggregate data and sort by amount
  const categories = Object.entries(categoryExpenses)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  const totalSpent = categories.reduce((sum, [, amount]) => sum + amount, 0);

  // Default fallback if no expenses
  if (totalSpent === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Spending Visualizer</Text>
        <Text style={styles.emptyText}>No debit transactions recorded yet.</Text>
      </View>
    );
  }

  // Calculate angles for donut chart
  const radius = 60;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  const getCategoryColor = (catName: string) => {
    return Colors.categories[catName] || Colors.slateGray;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food & Dining':
        return <Utensils size={14} color={Colors.categories['Food & Dining']} />;
      case 'Utilities & Bills':
        return <Zap size={14} color={Colors.categories['Utilities & Bills']} />;
      case 'Fuel & Travel':
        return <Car size={14} color={Colors.categories['Fuel & Travel']} />;
      case 'Groceries':
        return <ShoppingCart size={14} color={Colors.categories['Groceries']} />;
      case 'Shopping':
        return <ShoppingBag size={14} color={Colors.categories['Shopping']} />;
      case 'Health & Wellness':
        return <HeartPulse size={14} color={Colors.categories['Health & Wellness']} />;
      case 'Entertainment':
        return <Film size={14} color={Colors.categories['Entertainment']} />;
      default:
        return <PieChart size={14} color={Colors.slateLight} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Spending Visualizer</Text>
          <Text style={styles.subtitle}>September Outflow</Text>
        </View>
        <View style={styles.monthBadge}>
          <Text style={styles.monthBadgeText}>This Month</Text>
        </View>
      </View>

      <View style={styles.contentRow}>
        {/* Donut Chart SVG */}
        <View style={styles.chartWrapper}>
          <Svg width={140} height={140} viewBox="0 0 160 160">
            <G rotation="-90" origin="80, 80">
              {/* Background Track Circle */}
              <Circle
                cx="80"
                cy="80"
                r={radius}
                stroke={Colors.cardBgLight}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {categories.map(([category, amount], idx) => {
                const percentage = amount / totalSpent;
                const strokeDashoffset = circumference - circumference * percentage;
                const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`;
                const rotation = accumulatedAngle;
                accumulatedAngle += percentage * 360;

                return (
                  <Circle
                    key={`circle-${category}-${idx}`}
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={getCategoryColor(category)}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={0}
                    rotation={rotation}
                    origin="80, 80"
                    strokeLinecap="round"
                    fill="none"
                  />
                );
              })}
            </G>
          </Svg>

          {/* Center Text inside Donut */}
          <View style={styles.donutCenter}>
            <Text style={styles.donutCenterLabel}>Debits</Text>
            <Text style={styles.donutCenterValue}>{formatINR(totalSpent)}</Text>
          </View>
        </View>

        {/* Category Breakdown Bars */}
        <View style={styles.legendContainer}>
          {categories.slice(0, 4).map(([category, amount]) => {
            const pct = Math.round((amount / totalSpent) * 100);
            return (
              <View key={category} style={styles.legendItem}>
                <View style={styles.legendHeader}>
                  <View style={styles.catNameRow}>
                    <View style={styles.iconCircle}>
                      {getCategoryIcon(category)}
                    </View>
                    <Text style={styles.categoryName} numberOfLines={1}>
                      {category}
                    </Text>
                  </View>
                  <Text style={styles.categoryAmount}>{formatINR(amount)}</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: getCategoryColor(category),
                        width: `${Math.max(pct, 6)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  titleGroup: {},
  title: {
    color: Colors.crispWhite,
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.slateGray,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  monthBadge: {
    backgroundColor: Colors.cardBgLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  monthBadgeText: {
    color: Colors.slateSubtle,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterLabel: {
    color: Colors.slateLight,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  donutCenterValue: {
    color: Colors.crispWhite,
    fontSize: Typography.xs,
    fontWeight: '800',
    marginTop: 2,
  },
  legendContainer: {
    flex: 1,
    gap: 10,
  },
  legendItem: {
    width: '100%',
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  iconCircle: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    color: Colors.slateSubtle,
    fontSize: Typography.xs,
    fontWeight: '600',
    flexShrink: 1,
  },
  categoryAmount: {
    color: Colors.crispWhite,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.cardBgLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyText: {
    color: Colors.slateGray,
    fontSize: Typography.sm,
    marginTop: Spacing.sm,
  },
});
