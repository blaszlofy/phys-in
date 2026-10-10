import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    line,
    V2,
    xycorneraxes,
    plotf,
    Interactive,
    circle,
    arc,
    plotv,
    axes_transform,
    square,
    arrow1, text, distribute_horizontal_and_align, distribute_vertical_and_align, align_vertical, linspace, curve,
    boolean, Vdir
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


//STATIC
let sus_point = V2(-0.5, 4.3)
let circ_point = V2(-5, 1)

let outline = rectangle(16, 9).strokewidth(0)

let divider1 = line(V2(-8, -1.5), V2(8, -1.5))
let divider2 = line(V2(3, -1.5), V2(3, 4.5))
let divider3 = line(V2(3, 2.5), V2(8, 2.5))

let pot_square = square(0.3).fill("blue").strokewidth(0)
let kin_square = square(0.3).fill("red").strokewidth(0)
let pot_text = text("P.E. - potential energy").fontfamily("Math").fontsize(20)
let kin_text = text("K.E. - kinetic energy").fontfamily("Math").fontsize(20)

let legend = distribute_vertical_and_align(
    [distribute_horizontal_and_align([pot_square, pot_text], 1.4, "center"),
        distribute_horizontal_and_align([kin_square, kin_text], 1.3, "center")],
    0.1, "left").position(V2(4, 3.8)
)

let setup = diagram_combine(outline, divider1, divider2, divider3)

let suspension = line(V2(sus_point.x - 1.5, sus_point.y), V2(sus_point.x + 1.5, sus_point.y)).strokewidth(3).stroke("lightgray")

let axes_opt = {
    xrange: [0, 17],
    yrange: [-2, 2],
    yticks: [-1, 0, 1],
    bbox: [V2(-7.2, -4.2), V2(7.7, -1.8)],
    headsize: 0.1,
    n_sample: 200
}
let transf = axes_transform(axes_opt)

let axes = xycorneraxes(axes_opt).stroke("black").fill("black").fontfamily("Math").fontsize(20).textfill("black")
let time = text("t (s)").fontfamily("Math").fontsize(20).position(V2(7.4, -4.45))
let energy = text("x (m)").fontfamily("Math").fontsize(20).position(V2(-7.7,  -1.8))

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let t = inp["t"]
    let m = inp["m"]
    let k = inp["k"]
    let x0 = inp["x"]
    let v0 = inp["v"]

    let w = Math.sqrt(k / m)
    let x = (t) => x0 * Math.cos(w * t) + v0 / w * Math.sin(w * t)
    let v = (t) => -w * x0 * Math.sin(w * t) + v0 * Math.cos(w * t)

    let A = Math.sqrt(x0**2 + (v0 / w)**2)
    let theta = Math.atan2(x0, v0 / w)

    let outside = circle(A).fill("lightblue").strokewidth(0)
    let inside = boolean.difference(circle(A), diagram_combine(square(A).translate(V2(A * 0.5, A * 0.5)), square(A).translate(V2(-A * 0.5, -A * 0.5))))
        .strokewidth(0).fill("#9cbeef")
    let circ = diagram_combine(outside, inside).position(circ_point).rotate(w * t + theta).opacity(0.2)
    let shadow_ball = circle(0.15 * Math.cbrt(m)).position(circ_point.add(Vdir(w * t + theta).scale(A))).fill("lightblue").strokewidth(0)

    let ball_pos = V2(sus_point.x, 1 + x(t))

    let connector = line(V2(0, 1 + x(t)), V2(-6.5, 1 + x(t))).strokewidth(2).stroke("gray").strokedasharray([10])

    let ball = circle(0.15 * Math.cbrt(m)).position(ball_pos).fill("lightblue").strokewidth(0)
    let vel_vector = arrow1(ball_pos, ball_pos.add(V2(0, v(t) * 0.3)), 0.1).fill("lightred").stroke("lightred").strokewidth(2)

    let timeline = plotv([V2(t, -2), V2(t, 2)], axes_opt).stroke("lightgray").strokewidth(2).strokedasharray([10]);
    let pos_point = circle(0.05).fill("blue").strokewidth(0).position(V2(t, x(t)).apply(transf))

    let x_plot = plotf(X => x(X), axes_opt).strokewidth(2).stroke("lightblue")

    let max_energy = 0.5 * m * w**2 * A**2
    let ke = 0.5 * m * Math.pow(v(t), 2)
    let pe = 0.5 * k * Math.pow(x(t), 2)
    let ke_ratio = ke / max_energy

    let pot_energy_bar = rectangle(3, 1).position(V2(5.5, 0)).strokewidth(0).fill("blue")
    let kin_energy_bar = rectangle(3 * ke_ratio, 1).position(V2(4 + ke_ratio * 1.5, 0)).strokewidth(0).fill("red")
    let bar_outline = rectangle(3, 1).position(V2(5.5, 0)).strokewidth(0)
    let bar = diagram_combine(pot_energy_bar, kin_energy_bar, bar_outline)

    let kin_text = text(ke.toFixed(2)).fontfamily("Math").fontsize(20)
    let pot_text = text(pe.toFixed(2)).fontfamily("Math").fontsize(20)
    let total_text = text(max_energy.toFixed(2)).fontfamily("Math").fontsize(20).translate(V2(2.65, 0))
    let plus = text("+").fontfamily("Math").fontsize(20).translate(V2(0.4, 0)).translate(V2(0.5, 0))
    let equal = text("=").fontfamily("Math").fontsize(20).translate(V2(2.2,0))
    let pot_square2 = square(0.3).fill("blue").strokewidth(0)
    let kin_square2 = square(0.3).fill("red").strokewidth(0)
    let energy_values = align_vertical([
        distribute_horizontal_and_align([kin_square2, kin_text], 0.35, "center"),
        plus,
        distribute_horizontal_and_align([pot_square2, pot_text], 0.35, "center").translate(V2(1.25, 0)),
        equal, total_text], "center"
    ).position(V2(4.15, 1.5))

    let sp = spring(sus_point, ball_pos, 0.12, 12, 0.1, 300)

    draw(setup, axes, sp, time, energy, timeline, vel_vector, suspension, bar, legend, energy_values, x_plot, pos_point, circ, connector, ball, shadow_ball);
}

int.slider("t", 0, 17, 0, 0.02, 17, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("x", 0, 1, 1, 0.1, 10, (name, value) => name + "₀ = " + value.toFixed(1) + " m")
int.slider("v", 0, 3, 0, 0.1, 10, (name, value) => name + "₀ = " + value.toFixed(1) + " m/s")
int.slider("k", 10, 50, 30, 1, 10, (name, value) => name + " = " + value.toFixed(0) + " N/m")
int.slider("m", 1, 3, 2, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " kg")

int.draw()
int.draw()