import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { storefrontTokens } from "@mestryx/tokens";

export type ProductPromoProps = {
  productName: string;
  priceLabel: string;
  imageUrl: string;
  brandName?: string;
};

/**
 * Catalog product promo — storefront tokens (cream/green).
 * For ads / Reels / external product communication.
 */
export const ProductPromo = ({
  productName,
  priceLabel,
  imageUrl,
  brandName = "Luna Bijoux",
}: ProductPromoProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  const imageOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const imageScale = interpolate(frame, [0, 0.7 * fps], [1.08, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const nameOpacity = interpolate(frame, [0.35 * fps, 0.85 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const nameY = interpolate(frame, [0.35 * fps, 0.85 * fps], [36, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const priceOpacity = interpolate(frame, [0.7 * fps, 1.15 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const accentX = interpolate(frame, [0.2 * fps, fps], [-80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: storefrontTokens.color.background,
        color: storefrontTokens.color.foreground,
        fontFamily: storefrontTokens.fontSans,
      }}
    >
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <div
          style={{
            flex: 1.1,
            overflow: "hidden",
            opacity: imageOpacity,
            scale: imageScale,
          }}
        >
          {imageUrl ? (
            <Img
              src={imageUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: storefrontTokens.color.border,
              }}
            />
          )}
        </div>
        <div
          style={{
            flex: 0.9,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 96px",
            backgroundColor: storefrontTokens.color.card,
            borderLeft: `1px solid ${storefrontTokens.color.border}`,
          }}
        >
          <div
            style={{
              width: 64,
              height: 6,
              background: storefrontTokens.color.primary,
              marginBottom: 28,
              translate: `${accentX}px 0px`,
            }}
          />
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: storefrontTokens.color.mutedForeground,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 20,
              opacity: nameOpacity,
            }}
          >
            {brandName}
          </div>
          <div
            style={{
              fontFamily: storefrontTokens.fontDisplay,
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              opacity: nameOpacity,
              translate: `0px ${nameY}px`,
            }}
          >
            {productName}
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 40,
              fontWeight: 600,
              color: storefrontTokens.color.primary,
              opacity: priceOpacity,
            }}
          >
            {priceLabel}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
