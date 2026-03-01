// src/components/settings/tabs/info/index.tsx

import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { Forms, React } from "@webpack/common";
import { getLatestSwancordVersion } from "@utils/githubVersion";

import gitHash from "~git-hash";

const { FormTitle, FormText, FormSection, FormDivider } = Forms as any;

// Robust button fallback: tries to use Discord/Vencord Button if available,
// otherwise falls back to a styled <button>.
const Common: any = require("@webpack/common");
const Button =
  Common?.Button ??
  ((props: any) => (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid var(--background-modifier-accent)",
        background: "var(--background-secondary)",
        color: "var(--text-normal)",
        cursor: props.disabled ? "not-allowed" : "pointer"
      }}
    >
      {props.children}
    </button>
  ));

function InfoTab() {
  const [latest, setLatest] = React.useState<string>("Loading…");

  React.useEffect(() => {
    let alive = true;
    getLatestSwancordVersion()
      .then(v => alive && setLatest(v))
      .catch(() => alive && setLatest("Unknown"));
    return () => {
      alive = false;
    };
  }, []);

  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  const installed = gitHash ? `${gitHash}` : "devbuild";

  return (
    <SettingsTab>
      <FormTitle tag="h5">Swancord</FormTitle>

      <FormSection>
        <FormText>
          Swancord is a custom Discord client extension focused on customization,
          performance tweaks, and developer-level control.
        </FormText>
      </FormSection>

      <FormDivider />

      <FormSection title="Build">
        {/* ✅ This is the important part: stop showing devbuild as the main version */}
        <FormText>Version: {latest}</FormText>
        <FormText>Installed Build: {installed}</FormText>
        <FormText>Channel: Stable</FormText>
        <FormText>Runtime: Production</FormText>

        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button onClick={() => open("https://github.com/Brokaliy/Swancord/releases/latest")}>
            View Latest Release
          </Button>
          <Button onClick={() => open("https://github.com/Brokaliy/Swancord/releases")}>
            All Releases
          </Button>
        </div>
      </FormSection>

      <FormDivider />

      <FormSection title="Links">
        <FormText>Website: https://7n7.dev/swancord</FormText>
        <FormText>Badge Index: https://7n7.dev/swancord/badges</FormText>

        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button onClick={() => open("https://7n7.dev/swancord")}>Open Website</Button>
          <Button onClick={() => open("https://7n7.dev/swancord/badges")}>View Badges</Button>

          {/* ✅ Changelog button (website) */}
          <Button onClick={() => open("https://7n7.dev/swancord#changelog")}>
            View Changelog
          </Button>
        </div>
      </FormSection>
    </SettingsTab>
  );
}

export default wrapTab(InfoTab, "SwancordInfo");