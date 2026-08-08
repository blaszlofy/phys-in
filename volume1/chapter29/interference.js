import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, line, xyaxes, circle, axes_transform, arrow1, text, Vdir, mod, annotation, to_radian, plotf,
    square
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

//HTML CANVAS
const htmlcanvas = document.getElementById("htmlcanvas");
const ctx = htmlcanvas.getContext("2d");

function resizeCanvas() {
    htmlcanvas.width = htmlcanvas.clientWidth;
    htmlcanvas.height = htmlcanvas.clientHeight;
    redraw()
}
window.addEventListener('resize', resizeCanvas);

const world = {
    left: -8,
    right: 8,
    bottom: -4.5,
    top: 4.5
};

function worldToScreen(x, y) {
    return {
        x: (x - world.left) / (world.right - world.left) * htmlcanvas.width,
        y: (world.top - y) / (world.top - world.bottom) * htmlcanvas.height
    };
}

function drawArrow(start, end, options = {}) {
    const {
        strokeWidth = 2,
        headSize = 12,
        color = "red",
        opacity = 1
    } = options;

    const p1 = worldToScreen(start.x, start.y)
    const p2 = worldToScreen(end.x, end.y)

    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const angle = Math.atan2(dy, dx)
    const distance = Math.hypot(dx, dy)

    ctx.save()

    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.globalAlpha = opacity

    ctx.translate(p1.x, p1.y)
    ctx.rotate(angle)

    const lineEnd = Math.max(0, distance - headSize)

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(lineEnd, 0)
    ctx.stroke()

    ctx.translate(distance, 0);

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-headSize, -headSize / 2)
    ctx.lineTo(-headSize, headSize / 2)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
}

const c = 10
const k = 13000
let amount = 50
const dist = 300
const radius = 3.6
const center = V2(-7.5, 0)
const max = 4.2

let ax1_opt = {
    xrange: [0, 1000],
    yrange: [-500, 500],
    bbox: [V2(center.x, center.y - max), V2(center.x + 2 * max, center.y + max)],
    headsize: 0.1
}
let transf = axes_transform(ax1_opt)

let outline = rectangle(16, 9).strokewidth(0);

//let ax1 = xyaxes(ax1_opt).stroke("black").fill("black").fontfamily("Math").fontsize(20).textfill("black")

let ch = circle(0.15).strokewidth(0).fill("lightred").position(V2(-6.9, 4))
let ch_t = text("Positive electric charge").fontsize(20).fontfamily("Math").position(V2(-5.2, 4))
let evec = arrow1(V2(0, 0), V2(0.5, 0), 0.05).fill("red").stroke("red").strokewidth(2).position(V2(-7.15, 3.1))
let evec_t = text("Value of the electric field at a point").fontsize(20).fontfamily("Math").position(V2(-4.4, 3.1))
let inte = line(V2(0, 0), V2(0.5, 0)).stroke("blue").strokewidth(2).position(V2(-7.15, 2.2))
let inte_t = text("Intensity pattern I(θ)").fontsize(20).fontfamily("Math").position(V2(-5.15, 2.2))

let warning = diagram_combine(
    text("There are odd patterns").fontsize(20).fontfamily("Math").position(V2(4.35, 3.7)),
    text("in the electric field representation").fontsize(20).fontfamily("Math").position(V2(5, 3.3)),
    text("that do not have a physical").fontsize(20).fontfamily("Math").position(V2(4.55, 2.9)),
    text("meaning, but they are the result").fontsize(20).fontfamily("Math").position(V2(4.85, 2.5)),
    text("of sampling problems. More below...").fontsize(20).fontfamily("Math").position(V2(5.11, 2.1)),
).translate(V2(0.3, -0.7))

let stat = diagram_combine(line(V2(2.8, 4.5), V2(2.8, -4.5)),
    text("I").fontsize(20).fontfamily("Math").position(V2(2.6, 0.3)),
    text("θ").fontsize(20).fontfamily("Math").position(V2(-0.1, -4.2)),
    warning
)
let leg = diagram_combine(ch, ch_t, evec, evec_t, inte, inte_t).translate(V2(10.3, -5.4))

let int = new Interactive(control, canvas);

function normalize(value, maxValue) {
    return (value + maxValue) / (2 * maxValue);
}

let n_cache = 0
let d_cache = 0
let intensity_plot

int.draw_function = (inp) => {
    ctx.clearRect(0, 0, htmlcanvas.width, htmlcanvas.height);

    let A = 1
    let w = 8
    let t = inp["t"]
    let n = inp["n"]
    let d = inp["d"]

    let lambda = c * Math.PI * 2 / w
    let dy = d * lambda
    let start = -((n - 1) * dy / 2)

    let a_y = (time) => - A * w**2 * Math.sin(w * time)

    let pos_y = []
    let charges = []
    for (let i = 0; i < n; i++) {
        pos_y[i] = (time) => A * Math.sin(w * time) + start + i * dy
        charges[i] = circle(0.05).strokewidth(0).fill("lightred").position(V2(0, pos_y[i](t)).apply(transf))
    }

    let step_x = (ax1_opt.xrange[1] - ax1_opt.xrange[0]) / amount
    let step_y = (ax1_opt.yrange[1] - ax1_opt.yrange[0]) / amount

    let r = []
    let dir = []
    let ellipse_max = -start * 2 + dist
    for (let x = ax1_opt.xrange[0]; x <= ax1_opt.xrange[1]; x += step_x) {
        for (let y = ax1_opt.yrange[0]; y <= ax1_opt.yrange[1]; y += step_y) {
            if (V2(x, y).length() > ax1_opt.xrange[1] - 30) continue

            let ellipse = 0
            for (let i = 0; i < n; i++) {
                let charge_coord = V2(0, pos_y[i](t))
                let vec = charge_coord.sub(V2(x, y))

                r[i] = vec.length()
                dir[i] = vec.angle()

                if (i === 0 || i === n - 1) {
                    ellipse += r[i]
                }
            }

            if (ellipse < ellipse_max) continue

            let E_max = 0
            let E = 0
            for (let i = 0; i < n; i++) {
                E_max += -(k / (c**2 * r[i])) * A * w**2 * Math.cos(dir[i])
                E += -(k / (c**2 * r[i])) * a_y(t - r[i] / c) * Math.cos(dir[i])
            }

            let center_dir = V2(x, y).angle();
            let start_pos = V2(x, y).apply(transf);
            let end_pos = V2(x, y).add(Vdir(center_dir + Math.PI / 2).scale(E)).apply(transf);
            drawArrow({x: start_pos.x, y: start_pos.y}, {x: end_pos.x, y: end_pos.y}, {strokeWidth: 2, headSize: 6, color: "#d62728", opacity: normalize(E, E_max)})
        }
    }

    if (n_cache !== n || d_cache !== d) {
        n_cache = n
        d_cache = d

        let dtheta = Math.PI / 6 * 0.06
        let plot_axopt = {
            xrange: [-Math.PI/6 + dtheta, Math.PI/6 - dtheta],
            yrange: [0, 2.2],
            xticks: [],
            yticks: [],
            bbox: [V2(-Math.PI / 6 + dtheta, 0), V2(Math.PI / 6 - dtheta, 7)],
            headsize: 0,
            n_sample: 200,
        }

        let I_func = (angle) => {
            let delta = (w / c) * dy * Math.sin(angle)
            let element_factor = Math.pow(w, 4) * Math.pow(Math.cos(angle), 2)

            let array_factor
            if (Math.abs(delta) < 1e-5) {
                array_factor = Math.pow(n, 2)
            } else {
                array_factor = Math.pow(Math.sin(n * delta / 2) / Math.sin(delta / 2), 2)
            }

            let I = element_factor * array_factor
            let max_possible_I = Math.pow(10, 4) * Math.pow(10, 2) / 20

            return I / max_possible_I
        }

        let p_line = plotf(I_func, plot_axopt).stroke("blue").strokewidth(2)
        let p_axes = xyaxes(plot_axopt).stroke("gray").fontfamily("Math").fontsize(20).stroke("black").apply(mod.subdivide(30))

        let R_wall = ax1_opt.xrange[1]
        let I_scale = 30

        let polar_transform = (v) => {
            let current_angle = v.x
            let intensity = v.y

            let r = R_wall + (intensity * I_scale)

            let phys_x = r * Math.cos(current_angle)
            let phys_y = r * Math.sin(current_angle)

            return V2(phys_x, phys_y).apply(transf)
        }

        intensity_plot = diagram_combine(p_axes, p_line).transform(polar_transform)
    }

    draw(outline, stat, leg, ...charges, intensity_plot)
}

int.slider("t", 0, 10, 0, 0.05, 10, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("n", 2, 5, 2, 1, 10, (name, value) => name + " = " + value.toFixed(0))
int.slider("d", 1, 3, 2, 1, 10, (name, value) => name + " = " + value.toFixed(0) + "λ")

int.draw()
int.draw()

function redraw() {
    int.draw()
}
resizeCanvas();