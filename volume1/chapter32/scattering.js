import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, circle, V2, axes_transform, xyaxes, line, Vdir, text, square, arrow1
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

function getLightColor(freq) {
    const nm = 299792 / freq;

    let r = 0, g = 0, b = 0;

    if (nm >= 380 && nm < 440) {
        r = -(nm - 440) / (440 - 380);
        b = 1.0;
    } else if (nm >= 440 && nm < 490) {
        g = (nm - 440) / (490 - 440);
        b = 1.0;
    } else if (nm >= 490 && nm < 510) {
        g = 1.0;
        b = -(nm - 510) / (510 - 490);
    } else if (nm >= 510 && nm < 580) {
        r = (nm - 510) / (580 - 510);
        g = 1.0;
    } else if (nm >= 580 && nm < 645) {
        r = 1.0;
        g = -(nm - 645) / (645 - 580);
    } else if (nm >= 645 && nm <= 780) {
        r = 1.0;
    }

    const toHex = (c) => {
        const hex = Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16);
        return hex.padStart(2, '0');
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const lines = 12
const k = 60
const c = 10
const dist = 20
const max = 50
const amount = 17
const K = 5
const vis = 5

let ax_opt = {
    xrange: [-50, 50],
    yrange: [-50, 50],
    bbox: [V2(-1.5, -4.5), V2(7.5, 4.5)],
    headsize: 0.1
}
let transf = axes_transform(ax_opt)

let scaled = text("Note: The scattered electric field vectors").fontsize(20).fontfamily("Math").position(V2(-5.2, 4));
let scaled2 = text("are visually magnified by ~10⁷ for clarity.").fontsize(20).fontfamily("Math").position(V2(-5.1, 3.6));
let scaled3 = text("In reality, a single air molecule scatters").fontsize(20).fontfamily("Math").position(V2(-5.29, 3.2));
let scaled4 = text("a vanishingly small fraction of the light.").fontsize(20).fontfamily("Math").position(V2(-5.27, 2.8));

let ch = circle(0.15).strokewidth(0).fill("lightblue").position(V2(-6.9, 1))
let ch_t = text("Electron").fontsize(20).fontfamily("Math").position(V2(-5.89, 1))
let evec_t = text("Value of the electric field at a point").fontsize(20).fontfamily("Math").position(V2(-4.4, 0.4))

let div = line(V2(-2, 4.5), V2(-2, -4.5))

let stat = diagram_combine(scaled, scaled2, scaled3, scaled4, div, ch, ch_t, evec_t)

let outline = rectangle(16, 9).strokewidth(0);

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    ctx.clearRect(0, 0, htmlcanvas.width, htmlcanvas.height);

    let t = inp["t"]
    let w = inp["ω"] / 100
    let A = inp["E₀"]
    let f = w * 1000 / (Math.PI * 2)
    let col = getLightColor(f)

    let E_in = (x) => A * Math.cos((w / c) * x - w * t)
    let y = (time) => -K * A * Math.cos(w * time)
    let a_y = (time) => K * A * w**2 * Math.cos(w * time)

    let dirs = [line(V2(-50, 0).apply(transf), V2(50, 0).apply(transf)).stroke("gray").strokedasharray([10])]
    let step = (max - dist) / amount
    for (let theta = 0; theta < Math.PI * 2; theta += Math.PI * 2 / lines) {
        if (Math.abs(theta - Math.PI) < 0.1) continue
        if (Math.abs(theta) < 0.1) continue

        dirs.push(line(Vdir(theta).scale(dist).apply(transf), Vdir(theta).scale(max).apply(transf)).stroke("gray").strokedasharray([10]))

        for (let i = 0; i < amount; i++) {
            let pos = Vdir(theta).scale(dist + i * step)
            let r = pos.length()

            let E = -(k / (c**2 * r)) * a_y(t - r / c) * Math.cos(theta)

            let start_pos = pos.apply(transf);
            let end_pos = pos.add(Vdir(theta + Math.PI / 2).scale(E)).apply(transf);
            drawArrow({x: start_pos.x, y: start_pos.y}, {x: end_pos.x, y: end_pos.y}, {strokeWidth: 2, headSize: 6, color: col, opacity: 1})
        }
    }
    for (let x = -50; x < 50; x += step) {
        let E = vis *  E_in(x) //visual scale
        let start_pos = V2(x, 0).apply(transf)
        let end_pos = V2(x, E).apply(transf)
        drawArrow({x: start_pos.x, y: start_pos.y}, {x: end_pos.x, y: end_pos.y}, {strokeWidth: 2, headSize: 6, color: col, opacity: 1})

    }

    let sl = 0.02 * w**2
    let sigma_rect = rectangle(sl / 2, sl).skewY(-Math.PI / 7).strokewidth(0).opacity(0.5).fill("blue").position(V2(1.5, 0))

    let charge = circle(0.13).strokewidth(0).fill("lightblue").position(V2(0, y(t)).apply(transf))

    let sigma = text("σ = " + (0.01 * w**4).toFixed(2) + " ⋅ 10⁻³¹ m²").fontsize(20).fontfamily("Math").position(V2(-5, -3))

    let evec = arrow1(V2(0, 0), V2(0.5, 0), 0.05).fill(col).stroke(col).strokewidth(2).position(V2(-7.15, 0.4))

    draw(outline, stat, ...dirs, charge, evec, sigma_rect, sigma, sigma_rect.position(V2(-6.5, -3)))
}

int.slider("t", 0, 10, 0, 0.02, 10, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("E₀", 1, 1.5, 1, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " V/m")
int.slider("ω", 251, 483, 418, 1, 10, (name, value) => name + " = " + (value / 100).toFixed(2) + " ⋅ 10¹⁵ rad/s")

int.draw()
int.draw()

function redraw() {
    int.draw()
}
resizeCanvas();