import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { platformTokens } from "@mestryx/tokens";

export type MestryxPromoProps = {
  title: string;
  subtitle: string;
};

/**
 * Starter promo composition — brand tokens from @mestryx/tokens (platform).
 * Edit in Studio: pnpm --filter @mestryx/remotion studio
 */
export const MestryxPromo = ({ title, subtitle }: MestryxPromoProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const titleY = interpolate(frame, [0, 0.6 * fps], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const subOpacity = interpolate(frame, [0.35 * fps, fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const accentScale = interpolate(frame, [0.2 * fps, fps], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: platformTokens.color.background,
        color: platformTokens.color.foreground,
        fontFamily: platformTokens.fontSans,
        justifyContent: "center",
        alignItems: "center",
        padding: 96,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: platformTokens.color.primary,
          opacity: 0.18,
          scale: accentScale,
          top: "18%",
          right: "12%",
        }}
      />
      <div style={{ maxWidth: 1100, textAlign: "center" }}>
        <div
          style={{
            opacity: titleOpacity,
            translate: `0px ${titleY}px`,
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div
          style={{
            opacity: subOpacity,
            marginTop: 28,
            fontSize: 36,
            color: platformTokens.color.mutedForeground,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
