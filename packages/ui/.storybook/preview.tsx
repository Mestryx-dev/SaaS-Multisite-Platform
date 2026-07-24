import type { Preview } from "@storybook/react-vite";
import "@mestryx/tokens/fonts";
import "@mestryx/tokens/css";
import "../src/styles.css";
import "./preview.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Design system theme — default Vitrine (e-commerce storefront)",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "storefront", title: "Vitrine (e-commerce)" },
          { value: "platform", title: "Platform (admin)" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "storefront",
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as string) ?? "storefront";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.style.colorScheme =
          theme === "storefront" ? "light" : "dark";
      }
      return (
        <div
          data-theme={theme}
          className="sb-theme-root"
          style={{
            background: "var(--background)",
            color: "var(--foreground)",
            fontFamily: "var(--font-sans)",
          }}
        >
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: "fullscreen",
    backgrounds: { disable: true },

    a11y: {
      // Fail Vitest/Storybook tests on axe violations (WCAG). Was "todo" during bootstrap.
      test: "error",
    },
  },
};

export default preview;
