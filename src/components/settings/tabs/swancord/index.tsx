/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { FolderIcon, GithubIcon, LogIcon, PaintbrushIcon, RestartIcon } from "@components/Icons";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { openContributorModal } from "@components/settings/tabs/plugins/ContributorModal";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import { gitRemote } from "@shared/swancordUserAgent";
import { IS_MAC, IS_WINDOWS } from "@utils/constants";
import { Margins } from "@utils/margins";
import { isPluginDev } from "@utils/misc";
import { relaunch } from "@utils/native";
import { Alerts, Forms, React, useEffect, useRef, useState, UserStore } from "@webpack/common";

import { DonateButtonComponent, isDonor } from "./DonateButton";
import { VibrancySettings } from "./MacVibrancySettings";
import { NotificationSection } from "./NotificationSettings";

type KeysOfType<Object, Type> = {
    [K in keyof Object]: Object[K] extends Type ? K : never;
}[keyof Object];

// ── 7n7 donate card ──────────────────────────────────────────────────────────

function useBlinkingCursor() {
    const [on, setOn] = useState(true);
    useEffect(() => {
        const t = setInterval(() => setOn(v => !v), 530);
        return () => clearInterval(t);
    }, []);
    return on;
}

function useParticleCanvas(containerRef: React.RefObject<HTMLDivElement>) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d")!;
        let raf: number;

        const LINE_DIST = 90;
        const LINE_DIST_SQ = LINE_DIST * LINE_DIST;
        const NODE_COUNT = 30;
        const SPEED = 0.22;

        function resize() {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        }

        const nodes = Array.from({ length: NODE_COUNT }, () => ({
            x: Math.random() * container.offsetWidth,
            y: Math.random() * container.offsetHeight,
            vx: (Math.random() - 0.5) * SPEED * 2,
            vy: (Math.random() - 0.5) * SPEED * 2,
        }));

        function draw() {
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            for (const n of nodes) {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;
            }

            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < LINE_DIST_SQ) {
                        const alpha = (1 - Math.sqrt(d2) / LINE_DIST) * 0.1;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
                        ctx.lineWidth = 0.7;
                        ctx.stroke();
                    }
                }
            }

            for (const n of nodes) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255,255,255,0.12)";
                ctx.fill();
            }

            raf = requestAnimationFrame(draw);
        }

        resize();
        draw();

        const ro = new ResizeObserver(resize);
        ro.observe(container);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, []);

    return canvasRef;
}

function DonateCard({ title, subtitle, children }: {
    title: string;
    subtitle: string;
    children?: React.ReactNode;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useParticleCanvas(containerRef);
    const cursorOn = useBlinkingCursor();

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "14px",
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "24px 28px 22px",
                marginBottom: "16px",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0, left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
                {/* terminal brand */}
                <div style={{
                    fontFamily: "var(--font-code)",
                    fontSize: "0.8rem",
                    color: "#f0f0f0",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                }}>
                    <span style={{ opacity: 0.35 }}>root@</span>
                    <span>7n7</span>
                    <span style={{ opacity: 0.35 }}>:~#</span>
                    <span style={{
                        display: "inline-block",
                        width: "2px",
                        height: "0.85em",
                        background: "#f0f0f0",
                        borderRadius: "1px",
                        marginLeft: "5px",
                        verticalAlign: "middle",
                        opacity: cursorOn ? 1 : 0,
                        boxShadow: cursorOn ? "0 0 5px rgba(255,255,255,0.6)" : "none",
                    }} />
                </div>

                {/* title */}
                <div style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#f0f0f0",
                    letterSpacing: "-0.02em",
                    marginBottom: "6px",
                }}>
                    {title}
                </div>

                {/* subtitle */}
                <div style={{
                    fontSize: "0.83rem",
                    color: "rgba(255,255,255,0.4)",
                    lineHeight: 1.65,
                    marginBottom: "18px",
                }}>
                    {subtitle}
                </div>

                {children}
            </div>
        </div>
    );
}

// ── switches ─────────────────────────────────────────────────────────────────

function Switches() {
    const settings = useSettings(["useQuickCss", "enableReactDevtools", "frameless", "winNativeTitleBar", "transparent", "winCtrlQ", "disableMinSize"]);

    const Switches = [
        { key: "useQuickCss", title: "Enable Custom CSS" },
        !IS_WEB && {
            key: "enableReactDevtools",
            title: "Enable React Developer Tools",
            restartRequired: true
        },
        !IS_WEB && (!IS_DISCORD_DESKTOP || !IS_WINDOWS ? {
            key: "frameless",
            title: "Disable the window frame",
            restartRequired: true
        } : {
            key: "winNativeTitleBar",
            title: "Use Windows' native title bar instead of Discord's custom one",
            restartRequired: true
        }),
        !IS_WEB && {
            key: "transparent",
            title: "Enable window transparency",
            description: "A theme that supports transparency is required. Stops the window from being resizable as a side effect",
            restartRequired: true
        },
        IS_DISCORD_DESKTOP && {
            key: "disableMinSize",
            title: "Disable minimum window size",
            restartRequired: true
        },
        !IS_WEB && IS_WINDOWS && {
            key: "winCtrlQ",
            title: "Register Ctrl+Q as shortcut to close Discord (Alternative to Alt+F4)",
            restartRequired: true
        },
    ] satisfies Array<false | {
        key: KeysOfType<typeof settings, boolean>;
        title: string;
        description?: string;
        restartRequired?: boolean;
    }>;

    return Switches.map(setting => {
        if (!setting) return null;
        const { key, title, description, restartRequired } = setting;
        return (
            <FormSwitch
                key={key}
                title={title}
                description={description}
                value={settings[key]}
                onChange={v => {
                    settings[key] = v;
                    if (restartRequired) {
                        Alerts.show({
                            title: "Restart Required",
                            body: "A restart is required to apply this change",
                            confirmText: "Restart now",
                            cancelText: "Later!",
                            onConfirm: relaunch
                        });
                    }
                }}
            />
        );
    });
}

// ── main tab ─────────────────────────────────────────────────────────────────

function SwancordSettings() {
    const needsVibrancySettings = IS_DISCORD_DESKTOP && IS_MAC;
    const user = UserStore?.getCurrentUser();
    const donorUser = isDonor(user?.id);
    const devUser = isPluginDev(user?.id);

    return (
        <SettingsTab>
            {donorUser ? (
                <DonateCard
                    title="Thanks for donating."
                    subtitle="Your support keeps this running. Manage your perks by messaging @vending.machine."
                >
                    <DonateButtonComponent />
                </DonateCard>
            ) : (
                <DonateCard
                    title="Support Swancord."
                    subtitle="Everything is free. If it saved you time, consider chipping in — it goes directly towards more development."
                >
                    <DonateButtonComponent />
                </DonateCard>
            )}

            {devUser && (
                <DonateCard
                    title="Thanks for contributing."
                    subtitle="Your contributions are what make Swancord great. You earned a badge for it."
                >
                    <span
                        style={{
                            fontFamily: "var(--font-code)",
                            fontSize: "0.75rem",
                            color: "rgba(255,255,255,0.5)",
                            cursor: "pointer",
                            letterSpacing: "0.04em",
                        }}
                        onClick={() => openContributorModal(user)}
                    >
                        // see what you've contributed →
                    </span>
                </DonateCard>
            )}

            <section>
                <Forms.FormTitle tag="h5">Quick Actions</Forms.FormTitle>
                <QuickActionCard>
                    <QuickAction Icon={LogIcon} text="Notification Log" action={openNotificationLogModal} />
                    <QuickAction Icon={PaintbrushIcon} text="Edit QuickCSS" action={() => SwancordNative.quickCss.openEditor()} />
                    {!IS_WEB && (
                        <>
                            <QuickAction Icon={RestartIcon} text="Relaunch Discord" action={relaunch} />
                            <QuickAction Icon={FolderIcon} text="Open Settings Folder" action={() => SwancordNative.settings.openFolder()} />
                        </>
                    )}
                    <QuickAction
                        Icon={GithubIcon}
                        text="View Source Code"
                        action={() => SwancordNative.native.openExternal("https://github.com/" + gitRemote)}
                    />
                </QuickActionCard>
            </section>

            <Divider />

            <section className={Margins.top16}>
                <Forms.FormTitle tag="h5">Settings</Forms.FormTitle>
                <Forms.FormText className={Margins.bottom20} style={{ color: "var(--text-muted)" }}>
                    Hint: You can change the position of this settings section in the{" "}
                    <a onClick={() => openPluginModal(Swancord.Plugins.plugins.Settings)}>
                        settings of the Settings plugin
                    </a>!
                </Forms.FormText>
                <Switches />
            </section>

            {needsVibrancySettings && <VibrancySettings />}
            <NotificationSection />
        </SettingsTab>
    );
}

export default wrapTab(SwancordSettings, "Swancord Settings");
