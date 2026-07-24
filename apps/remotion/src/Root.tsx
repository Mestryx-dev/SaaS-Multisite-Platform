import { Composition } from "remotion";
import { BrandLaunch } from "./BrandLaunch";
import { MestryxPromo } from "./MestryxPromo";
import { ProductPromo } from "./ProductPromo";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MestryxPromo"
        component={MestryxPromo}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "mestryx-platform",
          subtitle: "Multi-site SaaS · CMS + commerce",
        }}
      />
      <Composition
        id="ProductPromo"
        component={ProductPromo}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          productName: "Collier Lune Rosée",
          priceLabel: "24,90 €",
          imageUrl:
            "https://images.unsplash.com/photo-1515562140607-ee22621dd758?w=1200&q=80",
          brandName: "Luna Bijoux",
        }}
      />
      <Composition
        id="BrandLaunch"
        component={BrandLaunch}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          headline: "One console. Many brands.",
          tagline: "CMS + commerce multisite for operators who ship.",
          cta: "mestryx.dev",
        }}
      />
    </>
  );
};
