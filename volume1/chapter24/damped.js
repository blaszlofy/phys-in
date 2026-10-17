import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, line, V2, linspace, curve, square, arrow1, xyaxes, plotf, text, axes_transform, xycorneraxes,
    ytickmark, circle,
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

const sus_point = V2(-7.8, 3.35)

let outline = rectangle(16, 9).strokewidth(0);

let div1 = line(V2(-8, 2.2), V2(8, 2.2))
let div2 = line(V2(-8, -0.5), V2(8, -0.5))
let div3 = line(V2(-8, -3.2), V2(8, -3.2))

let wall = line(V2(-7.8, 2.5), V2(-7.8, 4.2)).strokewidth(3).stroke("lightgray")
let equilibrium = line(V2(0, 2.3), V2(0, 4.4)).strokewidth(2).stroke("lightgray").strokedasharray([10])

let x_opt = {
    xrange: [0, 20],
    yrange: [-7.2, 7.2],
    bbox: [V2(-7, -0.4), V2(7.2, 2.1)],
    yticks: [-6, -2, 2, 6],
    n_sample: 400,
    headsize: 0.1
}

let E_opt = {
    xrange: [0, 20],
    yrange: [0, 35],
    bbox: [V2(-7, -2.85), V2(7.2, -0.6)],
    yticks: [10, 20, 30],
    n_sample: 400,
    headsize: 0.1
}

let x_ax = xyaxes(x_opt).fill("black").stroke("black").fontfamily("Math").fontsize(20).textfill("black")
let E_ax = xycorneraxes(E_opt).fill("black").stroke("black").fontfamily("Math").fontsize(20).textfill("black")

let x_transf = axes_transform(x_opt)
let E_transf = axes_transform(E_opt)

let F_leg = line(V2(0, 0), V2(0.5,  0)).stroke("red").strokewidth(1.5).position(V2(-6.3, 0))
let F_text = text("E(t)").fontsize(20).fontfamily("Math").position(V2(-5.5, 0))
let E_approx_leg = line(V2(0, 0), V2(0.5,  0)).stroke("gray").strokewidth(1.5).strokedasharray([10]).position(V2(-4.9, 0))
let E_approx_text = text("Energy approximation for high Q values").fontsize(20).fontfamily("Math").position(V2(-2, 0))
let x_leg = line(V2(0, 0), V2(0.5,  0)).stroke("blue").strokewidth(1.5).position(V2(-7.8, 0))
let x_text = text("x(t)").fontsize(20).fontfamily("Math").position(V2(-7, 0))

let leg = diagram_combine(F_leg, F_text, x_leg, x_text, E_approx_leg, E_approx_text).translate(V2(2, -3.85))

let t_text = text("t (s)").fontsize(20).fontfamily("Math").position(V2(7.6, 0.87))
let t_text2 = text("t (s)").fontsize(20).fontfamily("Math").position(V2(7.6, -2.85))
let x_g_text = text("x (m)").fontsize(20).fontfamily("Math").position(V2(-7.6, 2))
let E_g_text = text("E (J)").fontsize(20).fontfamily("Math").position(V2(-7.65, -0.7))

let stat = diagram_combine(div1, wall, equilibrium, div2, div3, x_ax, E_ax, leg, t_text, t_text2, x_g_text, E_g_text)

let int = new Interactive(control, canvas);

function x(t, A, w0, gamma) {
    //underdamped
    if (gamma < w0) {
        let w = Math.sqrt(w0**2 - gamma**2)
        return A * Math.exp(-gamma * t) * (Math.cos(w * t) + gamma / w * Math.sin(w * t))
    }
    //overdamped
    else if (gamma > w0) {
        let beta = Math.sqrt(gamma**2 - w0**2)
        return A * Math.exp(-gamma * t) * (Math.cosh(beta * t) + gamma / beta * Math.sinh(beta * t))
    }
    else {
        return A * (1 + gamma * t) * Math.exp(-gamma * t)
    }
}

function E(t, A, w0, gamma) {
    //underdamped
    if (gamma < w0) {
        let w = Math.sqrt(w0**2 - gamma**2)
        let E0 = 1 / 2 * w0**2 * A**2
        return E0 * Math.exp(-2 * gamma * t) * (Math.cos(w * t)**2 + 2 * gamma / w * Math.sin(w * t) * Math.cos(w * t) + (w0**2 + gamma**2) / w**2 * Math.sin(w * t)**2)
    }
    //overdamped
    else if (gamma > w0) {
        let beta = Math.sqrt(gamma**2 - w0**2)
        let E0 = 1 / 2 * w0**2 * A**2
        return E0 * Math.exp(-2 * gamma * t) * (Math.cosh(beta * t)**2 + 2 * gamma / beta * Math.sinh(beta * t) * Math.cosh(beta * t) + (w0**2 + gamma**2) / beta**2 * Math.sinh(beta * t)**2)
    }
    else {
        return 1 / 2 * w0**2 * A**2 * Math.exp(-2 * gamma * t) * (1 + 2 * gamma * t + 2 * gamma**2 * t**2)
    }
}

int.draw_function = (inp) => {
    let t = inp["t"]
    let w0 = inp["ω₀"]
    let A = inp["A"]
    let gamma = inp["γ"] / 100

    let _x = x(t, A, w0, gamma)
    let _E = E(t, A, w0, gamma)

    let mass_pos = V2(_x, sus_point.y)
    if (Math.abs(mass_pos.x) > 7.2) {
        mass_pos.x = Math.sign(mass_pos.x) * 7.2
    }

    let mass = square(0.6).strokewidth(0).fill("lightblue").position(mass_pos).mut()
    let sp = spring(sus_point, mass_pos, 0.2, 20, 0.13, 300).mut()
    if (Math.abs(_x) >= 7.2) {
        sp.fill("#e1e1e1").stroke("#e1e1e1")
        mass.fill("#e1e1e1").stroke("#e1e1e1")
    }

    let x_plot = plotf((t) => x(t, A, w0, gamma), x_opt).stroke("blue").strokewidth(1.5)
    let E_plot = plotf((t) => E(t, A, w0, gamma), E_opt).stroke("red").strokewidth(1.5)
    let E_approx_plot = plotf((t) => 1 / 2 * w0**2 * A**2 * Math.exp(-2 * gamma * t), E_opt).stroke("gray").strokewidth(1.5).strokedasharray([10])

    let timeline = line(V2(t, -7.2).apply(x_transf), V2(t, 7.2).apply(x_transf)).stroke("gray").strokedasharray([10])
    let timeline2 = line(V2(t, 0).apply(E_transf), V2(t, 35).apply(E_transf)).stroke("gray").strokedasharray([10])
    let pos_circ = circle(0.05).strokewidth(0).fill("blue").position(V2(t, _x).apply(x_transf))
    let en_circ = circle(0.05).strokewidth(0).fill("red").position(V2(t, _E).apply(E_transf))

    let Q = text("Q = " + (w0 / (2 * gamma)).toFixed(2)).fontsize(20).fontfamily("Math").position(V2(3.5, -3.85))
    let sign = " = "
    if (w0 > gamma) {
        sign = " > "
    } else if (w0 < gamma) {
        sign = " < "
    }
    let comparison = text("ω₀" + sign + "γ").fontsize(20).fontfamily("Math").position(V2(5, -3.85))

    draw(outline, sp, stat, mass, timeline, timeline2, x_plot, E_plot, E_approx_plot, Q, comparison, (Math.abs(_x) < 7.2) ? pos_circ : square(0), (Math.abs(_E) < 35) ? en_circ : square(0))
}

int.slider("t", 0, 20, 0, 0.02, 20, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("A", 3, 6, 5, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " m")
int.slider("ω₀", 2, 10, 3, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " rad/s")
int.slider("γ", 10, 400, 20, 10, 10, (name, value) => name + " = " + (value / 100).toFixed(1) + " s⁻¹")

int.draw()
int.draw()