import type { PluginTimelineItemProps } from "@getpaseo/plugin/client";
import { Text, View } from "react-native";
import type { ReviewData } from "../shared/review";

const LEVEL = {
  action: { label: "ACTION", color: "accent" },
  risk: { label: "RISK", color: "statusDanger" },
  todo: { label: "TODO", color: "statusWarning" },
} as const;

export function AttentionRow({ theme, layout, item }: PluginTimelineItemProps<ReviewData>) {
  const { status, items, reason } = item.data;
  const muted = { color: theme.colors.foregroundMuted, fontSize: layout.compact ? 13 : 14 };

  if (status === "checking") return <Text style={muted}>Attention: reading the response…</Text>;
  if (status === "failed") return <Text style={muted}>Attention: check failed ({reason})</Text>;
  if (items.length === 0) {
    return <Text style={muted}>Attention: nothing in this response needs you</Text>;
  }

  return (
    <View
      style={{
        gap: 6,
        padding: layout.compact ? 10 : 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface1,
      }}
    >
      {items.map((one, index) => (
        <View key={index} style={{ flexDirection: "row", gap: 8 }}>
          <Text
            style={{
              color: theme.colors[LEVEL[one.level].color],
              fontWeight: "700",
              fontSize: 12,
              width: 56,
            }}
          >
            {LEVEL[one.level].label}
          </Text>
          <Text style={{ color: theme.colors.foreground, flex: 1 }}>{one.text}</Text>
        </View>
      ))}
    </View>
  );
}
