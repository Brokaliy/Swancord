import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { Forms, React } from "@webpack/common";
import { getLatestSwancordVersion } from "@utils/githubVersion";

const { FormSection, FormTitle, FormText, FormDivider } = Forms as any;

function InfoTab() {
  const [version, setVersion] = React.useState("…");

  React.useEffect(() => {
    let alive = true;
    getLatestSwancordVersion()
      .then(v => alive && setVersion(v))
      .catch(() => alive && setVersion("Unknown"));
    return () => { alive = false; };
  }, []);

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
        <FormText>Version: {version}</FormText>
        <FormText>Channel: Stable</FormText>
        <FormText>Runtime: Production</FormText>
      </FormSection>

      <FormDivider />

      <FormSection title="Links">
        <FormText>Website: https://7n7.dev/swancord</FormText>
        <FormText>Badge Index: https://7n7.dev/swancord/badges</FormText>
      </FormSection>
    </SettingsTab>
  );
}

export default wrapTab(InfoTab, "SwancordInfo");