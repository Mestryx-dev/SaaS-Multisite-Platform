import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { platformTokens } from "@mestryx/tokens";

export type BrandLaunchProps = {
  headline: string;
  tagline: string;
  cta?: string;
};

const Wordmark = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.bezier(0.16, 1, 0.3, 1);
  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 0.6 * fps], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: platformTokens.color.background,
      }}
    >
      <div
        style={{
          opacity,
          scale,
          fontFamily: platformTokens.fontSans,
          fontSize: 88,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          color: platformTokens.color.foreground,
        }}
      >
        mestryx
      </div>
    </AbsoluteFill>
  );
};

const HeadlineScene = ({
  headline,
  tagline,
}: {
  headline: string;
  tagline: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.bezier(0.16, 1, 0.3, 1);
  const opacity = interpolate(frame, [0, 0.45 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 0.5 * fps], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: platformTokens.color.background,
        padding: 96,
      }}
    >
      <div style={{ maxWidth: 1200, textAlign: "center", opacity, translate: `0px ${y}px` }}>
        <div
          style={{
            fontFamily: platformTokens.fontSans,
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: platformTokens.color.foreground,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 34,
            color: platformTokens.color.mutedForeground,
            fontWeight: 500,
          }}
        >
          {tagline}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CtaScene = ({ cta }: { cta: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 0.45 * fps], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        backgroundColor: "transparent",
        paddingBottom: 120,
      }}
    >
      <div
        style={{
          opacity,
          translate: `0px ${y}px`,
          background: platformTokens.color.primary,
          color: platformTokens.color.primaryForeground,
          fontFamily: platformTokens.fontSans,
          fontSize: 28,
          fontWeight: 700,
          padding: "18px 40px",
          borderRadius: platformTokens.radius,
        }}
      >
        {cta}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Brand / launch external communication — platform tokens (dark).
 */
export const BrandLaunch = ({
  headline,
  tagline,
  cta = "mestryx.dev",
}: BrandLaunchProps) => {
  return (
    <AbsoluteFill style={{ backgroundColor: platformTokens.color.background }}>
      <Sequence from={0} durationInFrames={50} premountFor={15}>
        <Wordmark />
      </Sequence>
      <Sequence from={35} durationInFrames={70} premountFor={15}>
        <HeadlineScene headline={headline} tagline={tagline} />
      </Sequence>
      <Sequence from={75} durationInFrames={50} premountFor={15}>
        <CtaScene cta={cta} />
      </Sequence>
    </AbsoluteFill>
  );
};
