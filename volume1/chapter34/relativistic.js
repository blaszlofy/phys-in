import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, V2, axes_transform, axes_empty, xyaxes, curve, circle, axes_corner_empty, mod, regular_polygon, Vdir,
    plotv, arrow1, line, text,
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

const dt = 0.02 / 5
const c = 5
const r = 1.2

let outline = rectangle(16, 9);

let simp_opt = {
    xrange: [-1.4, 1.4],
    yrange: [0, 2.8],
    headsize: 0.1,
    bbox: [V2(-7.8, 1.5), V2(-5, 4.3)]
}
let simp_transf = axes_transform(simp_opt)
let simp_ax = axes_empty(simp_opt).stroke("black").fill("black")

let x_opt = {
    xrange: [0, 10 * c],
    yrange: [0, 2.8],
    headsize: 0.1,
    bbox: [V2(-4.5, 1.5), V2(7.8, 4.3)]
}
let x_transf = axes_transform(x_opt)
let x_ax = axes_corner_empty(x_opt).stroke("black").fill("black")

let a_opt = {
    xrange: [0, 10 * c],
    yrange: [-1.4, 1.4],
    headsize: 0.1,
    bbox: [V2(-4.5, -1.9), V2(7.8, 0.9)],
}
let a_transf = axes_transform(a_opt)
let a_ax = axes_empty(a_opt).stroke("black").fill("black")

let path = circle(r).position(V2(0, 1.4).apply(simp_transf)).stroke("gray").strokedasharray([10])

let x_leg = text("x").fontsize(20).fontfamily("Math").position(V2(-6.6, 4.3))
let z_leg = text("z").fontsize(20).fontfamily("Math").position(V2(-4.9, 1.6))
let x__leg = text("x'").fontsize(20).fontfamily("Math").position(V2(-4.7, 4.3))
let E_leg = text("Eₓ").fontsize(20).fontfamily("Math").position(V2(-4.75, 0.9))
let ct_leg = text("ct").fontsize(20).fontfamily("Math").position(V2(7.8, 1.7))
let ct2_leg = text("ct").fontsize(20).fontfamily("Math").position(V2(7.8, -0.3))

let div = line(V2(-8, -2.3), V2(8, -2.3))

let ch = circle(0.15).strokewidth(0).fill("lightblue").position(V2(-6.9, -2.9))
let ch_t = text("Positive charge").fontsize(20).fontfamily("Math").position(V2(-5.5, -2.9))
let evec = arrow1(V2(0, 0), V2(0.5, 0), 0.05).fill("red").stroke("red").strokewidth(2).position(V2(-7.15, -3.7))
let evec_t = text("Value of the electric field at a point").fontsize(20).fontfamily("Math").position(V2(-4.4, -3.7))
let x_ = line(V2(0, 0), V2(0.5, 0)).stroke("blue").strokewidth(2).position(V2(-1, -2.9))
let a_ = line(V2(0, 0), V2(0.5, 0)).stroke("lightblue").strokewidth(2).position(V2(-1, -3.7))
let x_t = text("Apparent position (x') of the moving charge").fontsize(20).fontfamily("Math").position(V2(2.3, -2.9))
let a_t = text("Acceleration of the apparent position (scaled by a constant)").fontsize(20).fontfamily("Math").position(V2(3.21, -3.7))

let leg = diagram_combine(ch, ch_t, evec, evec_t, x_, a_, x_t, a_t)

let stat = diagram_combine(simp_ax, x_ax, a_ax, path, x_leg, z_leg, x__leg, E_leg, ct_leg, ct2_leg, div, leg)

let int = new Interactive(control, canvas);

function getInterpolatedValue(t, data) {
    if (data.length === 0) return 0;
    if (t <= data[0].x) return data[0].y;
    if (t >= data[data.length - 1].x) return data[data.length - 1].y;

    for (let i = 0; i < data.length - 1; i++) {
        let p1 = data[i];
        let p2 = data[i + 1];

        if (t >= p1.x && t <= p2.x) {
            let fraction = (t - p1.x) / (p2.x - p1.x);
            return p1.y + fraction * (p2.y - p1.y);
        }
    }

    return 0;
}

int.draw_function = (inp) => {
    let v = inp["v"] / 100
    let t = inp["t"]

    let theta = (time) => -(v * c / r * time - Math.PI / 2) % (Math.PI * 2)

    let [x, y] = [(time) => Math.cos(theta(time)) * r, (time) => 1.4 + Math.sin(theta(time)) * r]

    let charge = circle(0.1).position(V2(x(t), y(t)).apply(simp_transf)).strokewidth(0).fill("lightred")

    let points = []
    for (let T = 0; T <= t; T += dt) {
        points.push(V2(c * T + x(t - T), y(t - T)))
    }
    let pl = plotv(points, x_opt).stroke("blue").strokewidth(2)

    let first_der = []
    for (let i = 1; i < points.length; i++) {
        let d_y = points[i].y - points[i - 1].y;
        let d_x = points[i].x - points[i - 1].x;

        first_der.push(V2(points[i - 1].x, d_y / d_x));
    }

    let second_der = []
    for (let i = 1; i < first_der.length; i++) {
        let d_y_prime = first_der[i].y - first_der[i - 1].y;
        let d_x = first_der[i].x - first_der[i - 1].x;
        second_der.push(V2(first_der[i - 1].x, d_y_prime / d_x));
    }

    let sec_der_pl = plotv(second_der, a_opt).stroke("lightblue").strokewidth(2)

    let vect = []
    const step = c * dt * 50
    for (let T = 0; T < c * t; T += step) {
        let E = getInterpolatedValue(T, second_der)
        vect.push(arrow1(V2(T, 0).apply(a_transf), V2(T, -Math.sign(E) * Math.min(Math.abs(E), a_opt.yrange[1])).apply(a_transf), 0.1).stroke("red").fill("red"))
    }


    draw(outline, stat, charge, ...vect, pl, sec_der_pl)
}

int.slider("t", 0, 10, 0, dt * 5, 10, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("v", 25, 99, 50, 1, 10, (name, value) => name + " = " + (value / 100).toFixed(2) + "c")

int.draw()
int.draw()