import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, axes_transform, xyaxes, text, line, plotf, circle
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

const c = 3
const center = V2(0, -1.2)
const width_half = 7.5
const height_half = 0.9
const dh = 2.3

let ax1_opt = {
    xrange: [-30, 30],
    yrange: [-2, 2],
    xticks: [],
    yticks: [],
    bbox: [V2(center.x - width_half, center.y + dh - height_half), V2(center.x + width_half, center.y + dh + height_half)],
    headsize: 0.1,
    n_sample: 500
}
let ax2_opt = {
    xrange: [-30, 30],
    yrange: [-2, 2],
    xticks: [],
    yticks: [],
    bbox: [V2(center.x - width_half, center.y - height_half), V2(center.x + width_half, center.y + height_half)],
    headsize: 0.1,
    n_sample: 500
}
let ax_opt = {
    xrange: [-30, 30],
    yrange: [-2, 2],
    xticks: [],
    yticks: [],
    bbox: [V2(center.x - width_half, center.y - dh - height_half), V2(center.x + width_half, center.y - dh + height_half)],
    headsize: 0.1,
    n_sample: 500
}
let transf = axes_transform(ax_opt)

let ax1 = xyaxes(ax1_opt).fontsize(20).fontfamily("Math").stroke("black").fill("black").textfill("black")
let ax2 = xyaxes(ax2_opt).fontsize(20).fontfamily("Math").stroke("black").fill("black").textfill("black")
let ax = xyaxes(ax_opt).fontsize(20).fontfamily("Math").stroke("black").fill("black").textfill("black")
let plus = text("+").fontfamily("Math").fontsize(26).position(V2(center.x, center.y + dh / 2))
let equal = text("=").fontfamily("Math").fontsize(26).position(V2(center.x, center.y - dh / 2))

let sg_l1 = line(V2(0, 0), V2(0.5, 0)).stroke("lightblue").strokewidth(2).position(V2(-7.5, 4))
let sg_t1 = text("The first wave").fontsize(20).fontfamily("Math").position(V2(-5.9, 4))
let sg_l2 = line(V2(0, 0), V2(0.5, 0)).stroke("lightred").strokewidth(2).position(V2(-7.5, 3.4))
let sg_t2 = text("The second wave").fontsize(20).fontfamily("Math").position(V2(-5.72, 3.4))
let sg_l = line(V2(0, 0), V2(0.5, 0)).stroke("blue").strokewidth(2).position(V2(-7.5, 2.8))
let sg_t = text("The sum of the two waves").fontsize(20).fontfamily("Math").position(V2(-5.2, 2.8))

let ph_l = circle(0.1).strokewidth(0).fill("lightpurple").position(V2(-1, 4))
let g_l = circle(0.1).strokewidth(0).fill("lightcyan").position(V2(-1, 3.4))
let l_l = circle(0.1).strokewidth(0).fill("yellow").position(V2(-1, 2.8))
let ph_t = text("Point moving at group velocity").fontsize(20).fontfamily("Math").position(V2(1.2, 4))
let g_t = text("Point moving at phase velocity").fontsize(20).fontfamily("Math").position(V2(1.2, 3.4))
let l_t = text("Point moving at the speed of light").fontsize(20).fontfamily("Math").position(V2(1.35, 2.8))


let leg = diagram_combine(sg_l1, sg_t1, sg_l2, sg_t2, sg_l, sg_t, ph_l, g_l, ph_t, g_t, l_l, l_t).translate(V2(2, 0))

let div = line(V2(-8, 2.3), V2(8, 2.3))

let stat = diagram_combine(ax1, ax2, ax, plus, equal, div, leg)

let outline = rectangle(16, 9).strokewidth(0);

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let a = inp["a"]
    let t = inp["t"]
    let w1 = inp["ω₁"]
    let w2 = inp["ω₂"]

    let k = (w) => w / c - a / (w * c)

    let dw = w1 - w2
    let dk = k(w1) - k(w2)
    let vp = (w1 + w2) / (k(w1) + k(w2))

    let s1 = (time, x) => Math.cos(w1 * time - k(w1) * x)
    let s2 = (time, x) => Math.cos(w2 * time - k(w2) * x)

    let wave1 = plotf((x) => s1(t, x), ax1_opt).stroke("lightblue").strokewidth(2)
    let wave2 = plotf((x) => s2(t, x), ax2_opt).stroke("lightred").strokewidth(2)
    let wave = plotf((x) => s1(t, x) + s2(t, x), ax_opt).stroke("blue").strokewidth(2)

    let env_top = plotf((x) => 2 * Math.cos((dw/2)*t - (dk/2)*x), ax_opt).stroke("gray").strokedasharray([10])
    let env_bot = plotf((x) => -2 * Math.cos((dw/2)*t - (dk/2)*x), ax_opt).stroke("gray").strokedasharray([10])

    let wrap = x => ((x + 30) % 60 + 60) % 60 - 30

    let lp = Math.abs(4 * Math.PI / (k(w1) + k(w2)))
    let actual_xp = vp * t - Math.round((vp * t - wrap(vp * t)) / lp) * lp
    actual_xp += actual_xp < -30 ? lp : actual_xp > 30 ? -lp : 0

    let phase = circle(0.1).strokewidth(0).fill("lightcyan").position(V2(actual_xp, s1(t, actual_xp) + s2(t, actual_xp)).apply(transf))

    let shapes = [outline, stat, wave1, wave2, wave, phase, env_top, env_bot]

    if (w1 !== w2) {
        let group = circle(0.1).strokewidth(0).fill("lightpurple").position(V2(wrap((dw / dk) * t), 2).apply(transf))
        shapes.push(group)
    }

    let light = circle(0.1).strokewidth(0).fill("yellow").position(V2(wrap(c * t), 2).apply(transf))

    draw(...shapes, light)
}

int.slider("t", 0, 10, 0, 0.02, 10, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("a", 0, 50, 50, 1, 10, (name, value) => name + " = " + value.toFixed(1))
int.slider("ω₁", 8, 15, 11, 1, 10, (name, value) => name + " = " + value.toFixed(0) + " rad/s")
int.slider("ω₂", 8, 15, 10, 1, 10, (name, value) => name + " = " + value.toFixed(0) + " rad/s")

int.draw()
int.draw()