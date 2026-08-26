import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, xyaxes, text, plotf, line, arrow1, axes_transform, Vdir
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");
let button = document.getElementById("sound")

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

let time = 0
let lastTimestamp = 0
let phase_diff = 0
let current_dw = 1

const w = 30
const center = V2(2.5, 0)
const width_half = 5
const height_half = 1.3
const dh = 3

let ax1_opt = {
    xrange: [-5, 5],
    yrange: [-4, 4],
    xticks: [],
    yticks: [],
    bbox: [V2(center.x - width_half, center.y + dh - height_half), V2(center.x + width_half, center.y + dh + height_half)],
    headsize: 0.1,
    n_sample: 500
}
let ax2_opt = {
    xrange: [-5, 5],
    yrange: [-4, 4],
    xticks: [],
    yticks: [],
    bbox: [V2(center.x - width_half, center.y - height_half), V2(center.x + width_half, center.y + height_half)],
    headsize: 0.1,
    n_sample: 500
}
let ax_opt = {
    xrange: [-5, 5],
    yrange: [-4, 4],
    xticks: [],
    yticks: [],
    bbox: [V2(center.x - width_half, center.y - dh - height_half), V2(center.x + width_half, center.y - dh + height_half)],
    headsize: 0.1,
    n_sample: 500
}
let phasor_opt = {
    xrange: [-1, 4],
    yrange: [-2, 2],
    xticks: [],
    yticks: [],
    bbox: [V2(-7.7, center.y - dh - height_half), V2(-3.15, center.y - dh + height_half * 1.5)],
    headsize: 0.1
}
let transf = axes_transform(phasor_opt)

let ax1 = xyaxes(ax1_opt).fontsize(20).fontfamily("Math").stroke("black").fill("black").textfill("black")
let ax2 = xyaxes(ax2_opt).fontsize(20).fontfamily("Math").stroke("black").fill("black").textfill("black")
let ax = xyaxes(ax_opt).fontsize(20).fontfamily("Math").stroke("black").fill("black").textfill("black")
let plus = text("+").fontfamily("Math").fontsize(26).position(V2(center.x, center.y + dh / 2))
let equal = text("=").fontfamily("Math").fontsize(26).position(V2(center.x, center.y - dh / 2))

let phasor_ax = xyaxes(phasor_opt).fontsize(20).fontfamily("Math").stroke("black").fill("black").textfill("black")

let div1 = line(V2(-2.8, 4.5), V2(-2.8, -4.5))
let div2 = line(V2(-8, -0.8), V2(-2.8, -0.8))

let sg_l1 = line(V2(0, 0), V2(0.5, 0)).stroke("lightblue").strokewidth(2).position(V2(-7.5, 4))
let sg_t1 = text("The first signal").fontsize(20).fontfamily("Math").position(V2(-5.9, 4))
let sg_l2 = line(V2(0, 0), V2(0.5, 0)).stroke("lightred").strokewidth(2).position(V2(-7.5, 3.4))
let sg_t2 = text("The second signal").fontsize(20).fontfamily("Math").position(V2(-5.72, 3.4))
let sg_l = line(V2(0, 0), V2(0.5, 0)).stroke("blue").strokewidth(2).position(V2(-7.5, 2.8))
let sg_t = text("The sum of the two signals").fontsize(20).fontfamily("Math").position(V2(-5.2, 2.8))
let amp1 = text("The arrows are the complex").fontfamily("Math").fontsize(20).position(V2(-5.1, 1.7))
let amp2 = text("vectors of the signals in a").fontfamily("Math").fontsize(20).position(V2(-5.25, 1.3))
let amp3 = text("coordinate system that rotates").fontfamily("Math").fontsize(20).position(V2(-4.95, 0.9))
let amp4 = text("with the first signal.").fontfamily("Math").fontsize(20).position(V2(-5.58, 0.5))

let leg = diagram_combine(sg_l1, sg_t1, sg_l2, sg_t2, sg_l, sg_t, amp1, amp2, amp3, amp4).translate(V2(-0.1, -0.3))

let stat = diagram_combine(ax1, ax2, ax, plus, equal, phasor_ax, div1, div2, leg)

let outline = rectangle(16, 9).strokewidth(0);

let int = new Interactive(control, canvas);

let ctx
int.draw_function = (inp) => {
    let A1 = inp["A₁"]
    let A2 = inp["A₂"]
    let dw = inp["Δω"]

    current_dw = dw

    let sig1 = plotf((t) => A1 * Math.cos((w + dw / 2) * t), ax1_opt).stroke("lightblue").strokewidth(2)
    let sig2 = plotf((t) => A2 * Math.cos((w - dw / 2) * t), ax2_opt).stroke("lightred").strokewidth(2)
    let sig = plotf((t) => A1 * Math.cos((w + dw / 2) * t) + A2 * Math.cos((w - dw / 2) * t), ax_opt).stroke("blue").strokewidth(2)
    let env_top = plotf((t) => Math.sqrt(A1**2 + A2**2 + 2 * A1 * A2 * Math.cos(dw * t)), ax_opt).stroke("gray").strokedasharray([10])
    let env_bottom = plotf((t) => -Math.sqrt(A1**2 + A2**2 + 2 * A1 * A2 * Math.cos(dw * t)), ax_opt).stroke("gray").strokedasharray([10])

    if (ctx) {
        o1.frequency.value = 220 + dw / (4 * Math.PI)
        o2.frequency.value = 220 - dw / (4 * Math.PI)

        g1.gain.value = A1 * 0.05
        g2.gain.value = A2 * 0.05
    }

    let ph1 = arrow1(V2(0, 0).apply(transf), V2(A1, 0).apply(transf), 0.1).stroke("lightblue").strokewidth(2)
    let ph2 = arrow1(V2(A1, 0).apply(transf), Vdir(phase_diff).scale(A2).add(V2(A1, 0)).apply(transf), 0.1).stroke("lightred").strokewidth(2)
    let ph = arrow1(V2(0, 0).apply(transf), Vdir(phase_diff).scale(A2).add(V2(A1, 0)).apply(transf), 0.1).stroke("blue").strokewidth(2)

    draw(outline, stat, sig1, sig2, sig, env_top, env_bottom, ph1, ph2, ph)
}

int.slider("A₁", 1, 2, 1, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " m")
int.slider("A₂", 1, 2, 1, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " m")
int.slider("Δω", 0.5, 15, 3, 0.5, 10, (name, value) => name + " = " + value.toFixed(1) + " rad/s")

int.draw()
int.draw()

let o1, o2, g1, g2
let playing = false

button.onclick = () => {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)()
        o1 = ctx.createOscillator()
        o2 = ctx.createOscillator()
        g1 = ctx.createGain()
        g2 = ctx.createGain()

        o1.connect(g1).connect(ctx.destination)
        o2.connect(g2).connect(ctx.destination)
        o1.start()
        o2.start()
        g1.gain.value = 0.05
        g2.gain.value = 0.05
        o1.frequency.value = 220 + current_dw / (4 * Math.PI)
        o2.frequency.value = 220 - current_dw / (4 * Math.PI)
    }

    playing = !playing
    playing ? ctx.resume() : ctx.suspend()
}

function tick(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp
    let dt = (timestamp - lastTimestamp) / 1000
    lastTimestamp = timestamp

    if (playing) {
        time += dt

        phase_diff -= current_dw * dt

        int.draw()
    }
    requestAnimationFrame(tick)
}

requestAnimationFrame(tick)