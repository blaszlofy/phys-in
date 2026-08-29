import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, line, mod, xyaxes, plotf, text
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");
let button = document.getElementById("sound")

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

let normalize = (val, max, min) => (val - min) / (max - min)

let time = 0
let lastTimestamp = 0

const amount = 11
const base = 110
const dist = 7
const y = -1.7
const height = 2

let ax_opt = {
    xrange: [-5, 5],
    yrange: [-1.1, 1.1],
    bbox: [V2(-dist, 1), V2(dist, 4)],
    yticks: [],
    xticks: [],
    headsize: 0.1,
    n_sample: 300
}
let ax = xyaxes(ax_opt).stroke("black").fill("black").textfill("black").fontfamily("Math").fontsize(20)
let div = line(V2(-8, -2.5), V2(8, -2.5))

let harm_l = line(V2(0, 0), V2(0.5, 0)).stroke("lightblue").strokewidth(2).position(V2(-2.7, -3.1))
let sig_l = line(V2(0, 0), V2(0.5, 0)).stroke("blue").strokewidth(2).position(V2(-2.7, -3.9))
let harm_t = text("Harmonics with volume control").fontfamily("Math").fontsize(20).position(V2(0, -3.1))
let sig_t = text("Audio signal, sum of the harmonics (normalized)").fontfamily("Math").fontsize(20).position(V2(1.01, -3.9))

let stat = diagram_combine(ax, div, harm_l, sig_l, harm_t, sig_t)

let outline = rectangle(16, 9).strokewidth(0);

let int = new Interactive(control, canvas);

let ctx
let t
let o = []
let g = []

let pos = []
let norm = []
int.draw_function = (inp) => {
    let bars = []
    let plots = []
    let total = 0

    for (let i = 0; i < amount; i++) {
        pos[i] = inp["p" + +i]
        norm[i] = normalize(pos[i].y, y + height, y)
        total += norm[i]

        let ol = rectangle(0.3, height).move_origin("bottom-center").position(V2(pos[i].x, y)).strokewidth(2).stroke("lightgray")
        let br = rectangle(0.3, pos[i].y - y).move_origin("bottom-center").position(V2(pos[i].x, y)).strokewidth(0).fill("lightblue")
        let tx = text(((i + 1) === 1 ? "" : (i + 1)) + "ω").fontsize(20).fontfamily("Math").position(V2(pos[i].x, y - 0.4))
        bars.push(br, ol, tx)

        plots.push(
            plotf((x) => norm[i] * Math.sin((i + 1) * x), ax_opt).stroke("lightblue").opacity(1 / Math.sqrt((i + 1))).strokewidth(2)
        )

        if (ctx) {
            g[i].gain.value = norm[i] / 20
        }
    }
    if (total === 0) {
        total = 1
    }

    let signal = plotf(x => {
        let sum = 0
        for (let i = 0; i < amount; i++) {
            sum += norm[i] * Math.sin((i + 1) * x)
        }
        return sum / total
    }, ax_opt).strokewidth(2).stroke("blue")

    draw(outline, ...bars, stat, ...plots, signal)
}

for (let i = 0; i < amount; i++) {
    let x = -dist + (i * (2 * dist)) / (amount - 1)
    int.locator("p" + i, V2(x, y + 2 / (i + 1)), 0.2, "blue", line(V2(x, y), V2(x, y + height)).apply(mod.subdivide(100)))
}

int.draw()
int.draw()

let playing = false

button.onclick = () => {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)()
        for (let i = 0; i < amount; i++) {
            o[i] = ctx.createOscillator()
            g[i] = ctx.createGain()
            o[i].connect(g[i]).connect(ctx.destination)
            g[i].gain.value = 0.02
            o[i].frequency.value = base * (i + 1)
            o[i].start()
        }
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
        t = time
        int.draw()
    }
    requestAnimationFrame(tick)
}

requestAnimationFrame(tick)