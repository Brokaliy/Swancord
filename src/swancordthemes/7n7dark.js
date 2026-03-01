// 7n7 Dark — white particle network background
// Injected as a companion script when the theme is enabled.
(function () {
    const CANVAS_ID = "swancord-7n7-nodes";

    const prev = document.getElementById(CANVAS_ID);
    if (prev) { prev._sc_stop?.(); prev.remove(); }

    const canvas = document.createElement("canvas");
    canvas.id = CANVAS_ID;

    Object.assign(canvas.style, {
        position: "fixed",
        top: "0", left: "0",
        width: "100%", height: "100%",
        zIndex: "999",
        pointerEvents: "none",
        opacity: "1",
    });
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const NODE_COUNT = 120;
    const LINE_DIST = 130;
    const LINE_DIST_SQ = LINE_DIST * LINE_DIST;
    const SPEED = 0.28;
    const NODE_ALPHA = 0.22;
    const LINE_ALPHA = 0.14;
    const NODE_RADIUS = 1.8;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();

    const nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * SPEED * 2,
        vy: (Math.random() - 0.5) * SPEED * 2,
    }));

    let raf;
    function draw() {
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        for (const n of nodes) {
            n.x += n.vx; n.y += n.vy;
            if (n.x < 0 || n.x > w) n.vx *= -1;
            if (n.y < 0 || n.y > h) n.vy *= -1;
        }

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const d2 = dx * dx + dy * dy;
                if (d2 < LINE_DIST_SQ) {
                    const alpha = (1 - Math.sqrt(d2) / LINE_DIST) * LINE_ALPHA;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = "rgba(255,255,255," + alpha.toFixed(3) + ")";
                    ctx.lineWidth = 0.7;
                    ctx.stroke();
                }
            }
        }

        for (const n of nodes) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255," + NODE_ALPHA + ")";
            ctx.fill();
        }

        raf = requestAnimationFrame(draw);
    }

    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(document.body);

    canvas._sc_stop = function () {
        cancelAnimationFrame(raf);
        ro.disconnect();
    };
})();
