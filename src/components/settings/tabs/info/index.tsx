/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 */

import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { Divider } from "@components/Divider";
import { GithubIcon, LogIcon, PaintbrushIcon } from "@components/Icons";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { Margins } from "@utils/margins";
import { Forms, React } from "@webpack/common";

import { getLatestSwancordVersion } from "@utils/githubVersion";
import gitHash from "~git-hash";

function InfoCard({
    title,
    subtitle,
    children
}: {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}) {
    return (
        <div
            style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "14px",
                background: "var(--background-secondary)",
                border: "1px solid var(--background-modifier-accent)",
                padding: "20px 22px",
                marginBottom: "16px",
            }}
        >
            <div style={{ fontFamily: "var(--font-code)", fontSize: "0.8rem", opacity: 0.65, marginBottom: 10 }}>
                <span style={{ opacity: 0.6 }}>root@</span>
                <span>7n7</span>
                <span style={{ opacity: 0.6 }}>:~#</span>
            </div>

            <div style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                {title}
            </div>

            {subtitle && (
                <div style={{ marginTop: 6, color: "var(--text-muted)", lineHeight: 1.6, fontSize: "0.85rem" }}>
                    {subtitle}
                </div>
            )}

            <div style={{ marginTop: 14 }}>
                {children}
            </div>
        </div>
    );
}

function InfoTab() {
    const [latest, setLatest] = React.useState<string>("…");

    React.useEffect(() => {
        let alive = true;
        getLatestSwancordVersion()
            .then(v => {
                if (!alive) return;
                // If your util returns empty/unknown, keep it readable
                const safe = (v && v.trim().length) ? v : "Unknown";
                setLatest(safe);
            })
            .catch(() => alive && setLatest("Unknown"));

        return () => { alive = false; };
    }, []);

    const installedBuild = gitHash ? String(gitHash).slice(0, 7) : "devbuild";

    const openExternal = (url: string) => {
        // Use native helper if present (matches your SwancordSettings tab)
        // @ts-ignore
        if (globalThis.SwancordNative?.native?.openExternal) SwancordNative.native.openExternal(url);
        else window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <SettingsTab>
            <InfoCard
                title="Swancord"
                subtitle="Swancord is a custom Discord client extension focused on customization, performance tweaks, and developer-level control."
            >
                <div style={{ display: "grid", gap: 6 }}>
                    {/* ✅ Latest version from website/GitHub util */}
                    <div><b>Version (Latest):</b> {latest}</div>

                    {/* ✅ Installed build hash/devbuild stays separate */}
                    <div><b>Installed Build:</b> {installedBuild}</div>

                    <div><b>Channel:</b> Stable</div>
                    <div><b>Runtime:</b> Production</div>
                </div>
            </InfoCard>

            <section className={Margins.top16}>
                <Forms.FormTitle tag="h5">Quick Actions</Forms.FormTitle>
                <QuickActionCard>
                    <QuickAction
                        Icon={GithubIcon}
                        text="View Latest Release"
                        action={() => openExternal("https://github.com/Brokaliy/Swancord/releases/latest")}
                    />
                    <QuickAction
                        Icon={GithubIcon}
                        text="All Releases"
                        action={() => openExternal("https://github.com/Brokaliy/Swancord/releases")}
                    />
                    <QuickAction
                        Icon={LogIcon}
                        text="View Changelog"
                        action={() => openExternal("https://7n7.dev/swancord/changelog")}
                    />
                    <QuickAction
                        Icon={PaintbrushIcon}
                        text="Badge Index"
                        action={() => openExternal("https://7n7.dev/swancord/badges")}
                    />
                </QuickActionCard>
            </section>

            <Divider />

            <section className={Margins.top16}>
                <Forms.FormTitle tag="h5">Links</Forms.FormTitle>
                <Forms.FormText className={Margins.bottom20} style={{ color: "var(--text-muted)" }}>
                    Website:{" "}
                    <a onClick={() => openExternal("https://7n7.dev/swancord")}>https://7n7.dev/swancord</a>
                    <br />
                    Badges:{" "}
                    <a onClick={() => openExternal("https://7n7.dev/swancord/badges")}>https://7n7.dev/swancord/badges</a>
                </Forms.FormText>
            </section>
        </SettingsTab>
    );
}

export default wrapTab(InfoTab, "SwancordInfo");