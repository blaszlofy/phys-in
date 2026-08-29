import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, line, xyaxes, text, plotf, table, TAG
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

const amount = 50
const display = 15
const w = 15
const h = 4
const y = 2.2
const c = 10

let ax_opt = {
    xrange: [0, w],
    yrange: [-h / 2, h / 2],
    bbox: [V2(-w / 2, y - h / 2), V2(w / 2, y + h / 2)],
}

let harm_l = line(V2(0, 0), V2(0.5, 0)).stroke("lightblue").strokewidth(2).position(V2(-2.7, -3.4))
let sig_l = line(V2(0, 0), V2(0.5, 0)).stroke("blue").strokewidth(2).position(V2(-2.7, -3.9))
let harm_t = text("Harmonic functions").fontfamily("Math").fontsize(20).position(V2(-0.64, -3.4))
let sig_t = text("String, sum of the simple harmonic functions").fontfamily("Math").fontsize(20).position(V2(0.8, -3.9))

let leg = diagram_combine(harm_l, sig_l, harm_t, sig_t)

let wall1 = line(V2(-w / 2, y - h / 2), V2(-w / 2, y + h / 2)).strokewidth(3).stroke("gray")
let wall2 = line(V2(w / 2, y - h / 2), V2(w / 2, y + h / 2)).strokewidth(3).stroke("gray")

let div = diagram_combine(line(V2(-8, -2.8), V2(8, -2.8)))
let stat = diagram_combine(wall1, wall2, leg, div)

let outline = rectangle(16, 9).strokewidth(0);

let int = new Interactive(control, canvas);

let ctx;
let o = [];
let g = [];
let wasPlaying = true;
let time = 0;
let lastTimestamp = 0;

let initAudio = () => {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < amount; i++) {
        o[i] = ctx.createOscillator();
        g[i] = ctx.createGain();
        o[i].connect(g[i]).connect(ctx.destination);
        g[i].gain.value = 0;
        o[i].frequency.value = 110 * (i + 1);
        o[i].start();
    }
};

function tick(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    let dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    let isPlaying = int.intervals["t"] !== undefined;

    if (isPlaying) {
        time += dt;
        if (!wasPlaying) {
            if (!ctx) initAudio();
            if (ctx.state === 'suspended') ctx.resume();
            wasPlaying = true;
        }

    } else {
        if (wasPlaying) {
            if (ctx && ctx.state === 'running') ctx.suspend();
            wasPlaying = false;
        }
        time = int.get("t");
    }
    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

let fourier = []
let pos_cache = V2(100, 100)
int.draw_function = (inp) => {
    let t = inp["t"]
    let p = inp["p"]
    let d = p.x + w / 2
    let H = p.y - y

    if (pos_cache.x !== p.x || pos_cache.y !== p.y) {
        pos_cache = p
        int.set("t", 0)
        for (let i = 0; i < amount; i++) {
            fourier[i] = 2 * H * w**2 / ((i + 1)**2 * Math.PI**2 * d * (w - d)) * Math.sin((i + 1) * Math.PI * d / w)
            if (ctx) {

                g[i].gain.value = Math.abs(fourier[i]) * 0.02;
            }
        }
    }

    let sum = (x, t) => {
        let total = 0
        for (let i = 0; i < amount; i++) {
            total += fourier[i] * Math.sin((i + 1) * Math.PI * x / w) * Math.cos((i + 1) * Math.PI * c * t / w)
        }
        return total
    }

    let string = plotf((x) => sum(x, t), ax_opt).stroke("blue").strokewidth(2)

    let components = []
    for (let i = 0; i < display; i++) {
        components[i] = plotf(x => fourier[i] * Math.sin((i + 1) * Math.PI * x / w) * Math.cos((i + 1) * Math.PI * c * t / w), ax_opt).strokewidth(1).stroke("lightblue").opacity(1 / Math.sqrt(i + 1))
    }

    let harm = 10
    let row1 = []
    let row2 = []
    let small_opt = {
        xrange: [0, w],
        yrange: [-h / 2, h / 2],
        bbox: [V2(-w / harm + 0.1, -h / harm - 0.3), V2(w / harm - 0.1,  h / harm + 0.3)],
        yticks: [],
        xticks: [],
        n_sample: 20
    }
    for (let i = 0; i < harm; i++) {
        let harmonic = plotf(x => fourier[i] * Math.sin((i + 1) * Math.PI * x / w) * Math.cos((i + 1) * Math.PI * c * t / w), small_opt).strokewidth(2).stroke("lightblue")

        if (i < harm / 2) {
            row1.push(diagram_combine(harmonic, rectangle(w / harm, 2 * h / harm + 0.4).strokewidth(0)))
        } else {
            row2.push(diagram_combine(harmonic, rectangle(w / harm, 2 * h / harm + 0.4).strokewidth(0)))
        }
    }
    let tb = table.table([row1, row2], 0.1, "rows").translate(V2(-7.5, 0)).apply_to_tagged_recursive(TAG.TABLE_CELL, (d) => d.stroke('none'))

    draw(outline, ...components, stat, string, tb)
}

const delta = 0.3
int.locator("p", V2(-6, y + 1.3), 0.2, "blue", null, true, null, {type: "rect", min: V2(-w / 2 + delta, y - h / 2), max: V2(w / 2 - delta, y + h / 2)})

int.slider("t", 0, 20, 0, 0.02, 20, (name, value) => name + " = " + value.toFixed(2) + " s")

int.draw()
int.draw()