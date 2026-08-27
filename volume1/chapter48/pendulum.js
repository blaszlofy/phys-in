import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, V2, line, arc, linspace, curve, circle, axes_transform, xyaxes, xtickmark, ytickmark, TAG, plotf, text,
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

function spring(p1, p2, radius = 1, coil_number = 10, separation_coefficient = 0.5, sample_number = 100) {
    let angle = p2.sub(p1).angle();
    let length = p2.sub(p1).length();
    let R = separation_coefficient;
    let n = coil_number;
    let k = radius / R; // k*R = radius
    let a = (2 * n + 1) * Math.PI;
    let b = (length - 2 * R) / a;
    let parametric_function = (t) => V2(b * t + R - R * Math.cos(t), k * R * Math.sin(t));
    let points = linspace(0, a, sample_number).map(parametric_function);
    return curve(points).rotate(angle).translate(p1);
}

const center = V2(-3, 4)
const dist = 5
const g = 9.81

let top = line(center.add(V2(-dist / 2 - 2, 0)), center.add(V2(dist / 2 + 2, 0))).strokewidth(3).stroke("gray")
let ang1 = arc(1.5, Math.PI / 4).rotate(-Math.PI / 2 - Math.PI / 8).position(center.add(V2(-dist / 2, 0))).stroke("gray").strokedasharray([11])
let ang2 = arc(1.5, Math.PI / 4).rotate(-Math.PI / 2 - Math.PI / 8).position(center.add(V2(dist / 2, 0))).stroke("gray").strokedasharray([11])

let ax_opt = {
    xrange: [0, 20],
    yrange: [-Math.PI / 8 - 0.05, Math.PI / 8 + 0.05],
    yticks: [],
    bbox: [V2(-7.2, -4.2), V2(7.2, -1.3)],
    headsize: 0.1,
    n_sample: 300
}
let transf = axes_transform(ax_opt)
let ax = xyaxes(ax_opt).fontsize(20).fontfamily("Math").textfill("black").stroke("black").fill("black")
let tick1 = ytickmark(Math.PI / 16, 0, "𝜋/16", ax_opt).fontfamily("Math").fontsize(20).textfill("black").stroke("black")
    .apply_to_tagged_recursive(TAG.GRAPH_TICK_LABEL, d => d.translate(V2(-0.05, 0)))
let tick2 = ytickmark(-Math.PI / 16, 0, "-𝜋/16", ax_opt).fontfamily("Math").fontsize(20).textfill("black").stroke("black")
    .apply_to_tagged_recursive(TAG.GRAPH_TICK_LABEL, d => d.translate(V2(-0.05, 0)))

let div1 = line(V2(-8, -1), V2(8, -1))
let div2 = line(V2(2, 4.5), V2(2, -1))

let t_t = text("t (s)").fontsize(20).fontfamily("Math").position(V2(7.7, -2.75))
let ang_t = text("θ").fontsize(20).fontfamily("Math").position(V2(-7.5, -1.35))

let pend1_l = line(V2(0, 0), V2(0.5, 0)).stroke("lightblue").strokewidth(2).position(V2(2.5, 4))
let pend2_l = line(V2(0, 0), V2(0.5, 0)).stroke("lightred").strokewidth(2).position(V2(2.5, 3))
let pend1_t = text("Angle of the blue pendulum").fontsize(20).fontfamily("Math").position(V2(4.89, 4))
let pend1_t2 = text("from the vertical").fontsize(20).fontfamily("Math").position(V2(4.24, 3.6))
let pend2_t = text("Angle of the red pendulum").fontsize(20).fontfamily("Math").position(V2(4.84, 3))
let pend2_t2 = text("from the vertical").fontsize(20).fontfamily("Math").position(V2(4.24, 2.6))
let D = circle(0.08).strokewidth(0).fill("blue").position(V2(2.75, 2))
let D2 = circle(0.2).strokewidth(0).fill("lightblue").position(V2(2.75, 2))
let D_t = text("These points specify the").fontsize(20).fontfamily("Math").position(V2(4.67, 2))
let D_t2 = text("initial angles of the").fontsize(20).fontfamily("Math").position(V2(4.41, 1.6))
let D_t3 = text("pendulums (at t = 0)").fontsize(20).fontfamily("Math").position(V2(4.56, 1.2))

let leg = diagram_combine(pend1_l, pend2_l, pend1_t, pend1_t2, pend2_t, pend2_t2, D2, D, D_t, D_t2, D_t3).translate(V2(0.4, -0.8))

let stat = diagram_combine(top, ang1, ang2, div1, div2, ax, tick1, tick2, t_t, ang_t, leg)

let outline = rectangle(16, 9).strokewidth(0);

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let t = inp["t"]
    let k = inp["k"]
    let l = inp["l"]
    let m = inp["m"]

    let loc1 = inp["t1"]
    let loc2 = inp["t2"]
    let theta1_0 = loc1.sub(center.add(V2(-dist / 2, 0))).rotate(Math.PI / 2).angle()
    let theta2_0 = loc2.sub(center.add(V2(dist / 2, 0))).rotate(Math.PI / 2).angle()

    let w1 = Math.sqrt(g / l)
    let w2 = Math.sqrt(g / l + 2 * k / m)

    let t1 = (time) => (theta1_0 + theta2_0) / 2 * Math.cos(w1 * time) + (theta1_0 - theta2_0) / 2 * Math.cos(w2 * time)
    let t2 = (time) => (theta1_0 + theta2_0) / 2 * Math.cos(w1 * time) - (theta1_0 - theta2_0) / 2 * Math.cos(w2 * time)

    let dir1 = V2(Math.sin(t1(t)), -Math.cos(t1(t)))
    let dir2 = V2(Math.sin(t2(t)), -Math.cos(t2(t)))
    let pos1 = center.add(V2(-dist / 2, 0)).add(dir1.scale(l))
    let pos2 = center.add(V2(dist / 2, 0)).add(dir2.scale(l))

    let rope1 = line(center.add(V2(-dist / 2, 0)), pos1).stroke("lightgray").strokewidth(3)
    let rope2 = line(center.add(V2(dist / 2, 0)), pos2).stroke("lightgray").strokewidth(3)

    let mass1 = circle(Math.cbrt(m) * 0.15).strokewidth(0).fill("lightblue").position(pos1)
    let mass2 = circle(Math.cbrt(m) * 0.15).strokewidth(0).fill("lightred").position(pos2)

    let sp = spring(center.add(V2(-dist / 2, 0)).add(dir1.scale(l)), center.add(V2(dist / 2, 0)).add(dir2.scale(l)), 0.15, 20, 0.12, 300)

    let plot1 = plotf((time) => t1(time), ax_opt).strokewidth(2).stroke("lightblue")
    let plot2 = plotf((time) => t2(time), ax_opt).strokewidth(2).stroke("lightred")

    let timeline = line(V2(t, -Math.PI / 8).apply(transf), V2(t, Math.PI / 8).apply(transf)).stroke("gray").strokedasharray([10])
    let point1 = circle(0.05).strokewidth(0).fill("blue").position(V2(t, t1(t)).apply(transf))
    let point2 = circle(0.05).strokewidth(0).fill("red").position(V2(t, t2(t)).apply(transf))

    draw(outline, sp, rope1, rope2, stat, mass1, mass2, timeline, plot1, plot2, point1, point2)
}

int.slider("t", 0, 20, 0, 0.02, 20, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("k", 2, 10, 3, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " N/m")
int.slider("l", 2, 4, 3, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " m")
int.slider("m", 3, 6, 4, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " kg")

int.locator("t1", center.add(V2(-dist / 2, -1.5)), 0.2, "blue", ang1)
int.locator("t2", center.add(V2(dist / 2 + 1, -1.5)), 0.2, "blue", ang2)

int.draw()
int.draw()