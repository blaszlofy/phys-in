import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, xycorneraxes, plotf, line, mod, axes_transform, annotation, circle, arrow1, text,
    rectangle_corner, TAG
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

let canvas_tex = document.getElementById("tex");

let handletex = (str, conf) => {
    return MathJax.tex2svg(str, conf).innerHTML;
};

let draw_tex = (...diagrams) => {
    draw_to_svg_element(canvas_tex, diagram_combine(...diagrams));
    handle_tex_in_svg(canvas_tex, handletex);
};

//STATIC
let outline = rectangle(16, 9).strokewidth(0);
let ax_opt = {
    xrange: [0, 10],
    yrange: [0, 6],
    bbox: [V2(-6.5, -4), V2(7.5, 3)],
    headsize: 0.1
}
const x = time => -0.000000990783437*time**10 + 0.000021037529294*time**9 + 0.000202274791939*time**8 - 0.010202611835379*time**7 + 0.124504873380118*time**6 - 0.717861769721937*time**5 + 2.003475042584663*time**4 - 1.958550419885061*time**3 - 1.628181199973283*time**2 + 4.186593763913083*time
const v = time => -0.00000990783437*time**9 + 0.000189337763646*time**8 + 0.001618198335512*time**7 - 0.071418282847653*time**6 + 0.747029240280708*time**5 - 3.589308848609685*time**4 + 8.013900170338652*time**3 - 5.875651259655183*time**2 - 3.256362399946566*time + 4.186593763913083
let ax = xycorneraxes(ax_opt).stroke("black").fill("black").textfill("black").fontfamily("Math").fontsize(20)
let pos_plot = plotf((t) => x(t), ax_opt).stroke("lightblue").strokewidth(3)
let transf = axes_transform(ax_opt)
let loc_bound = line(ax_opt.bbox[0], V2(ax_opt.bbox[1].x - 0.01, ax_opt.bbox[0].y)).strokewidth(1).apply(mod.subdivide(400))

let vel_limit = text("$$v = \\lim_{\\Delta t \\to 0} \\frac{\\Delta s}{\\Delta t} = \\frac{ds}{dt} = $$").fontsize(20).position(V2(-11, 10))
let rect = rectangle_corner(vel_limit.bounding_box()[0], vel_limit.bounding_box()[1])
let vel = text("$$\\frac{\\Delta s}{\\Delta t} = $$").fontsize(20).position(V2(-5, 10))
let legend_tex = diagram_combine(vel_limit, vel, rect)

let s_leg = text("s (m)").fontfamily("Math").fontsize(20).position(V2(-6.5, 3.2))
let t_leg = text("t (s)").fontfamily("Math").fontsize(20).position(V2(7.1, -4.25))
let exact_line = line(V2(0, 0), V2(0, 0.5)).position(V2(-4.9, 3.7)).stroke("red").strokewidth(1.5)
let emp_line = line(V2(0, 0), V2(0, 0.5)).position(V2(-0.4, 3.7)).stroke("black").strokewidth(1.5).strokedasharray([10])
let exact_line2 = line(V2(0, 0), V2(0.45, 0)).position(V2(3.2, 4.2)).stroke("red").strokewidth(1.5)
let emp_line2 = line(V2(0, 0), V2(0.5, 0)).position(V2(3.2, 3.7)).stroke("black").strokewidth(1.5).strokedasharray([10])
let exact = text("Actual velocity of the ball").fontfamily("Math").fontsize(20).position(V2(5.2, 4.2))
let emp = text("Approximated velocity").fontfamily("Math").fontsize(20).position(V2(5.07, 3.7))
let legend = diagram_combine(s_leg, t_leg, exact_line, emp_line, exact_line2, emp_line2, exact, emp)

let int = new Interactive(control, canvas);

let t_cache = -1;
int.draw_function = (inp) => {
    let pos = inp["pos"].sub(ax_opt.bbox[0]).scale((ax_opt.xrange[1] - ax_opt.xrange[0]) / (ax_opt.bbox[1].x - ax_opt.bbox[0].x))
    let t = inp["t"]
    let dt = inp["Δt"]

    if (t_cache !== t || int.intervals["t"] !== undefined) {
        int.remove_locator("pos")
        int.locator("pos", V2(t,0).apply(transf), 0.2, "blue", loc_bound, true)
        pos = V2(t,0)
        t_cache = t
    }

    if (pos.x + dt >= 10) {
        dt = 10 - pos.x
    }

    let pos_t = V2(pos.x, x(pos.x)).apply(transf)
    let pos_dt = V2(pos.x + dt, x(pos.x + dt)).apply(transf)
    let l_vert_t = line(V2(pos.x, 0).apply(transf), pos_t).strokedasharray([10]).stroke("gray")
    let l_vert_dt = line(V2(pos.x +  dt, 0).apply(transf), pos_dt).strokedasharray([10]).stroke("gray")
    let l_hor_t = line(V2(-0.6, x(pos.x)).apply(transf), pos_t).strokedasharray([10]).stroke("gray")
    let l_hor_dt = line(V2(0, x(pos.x + dt)).apply(transf), pos_dt).strokedasharray([10]).stroke("gray")

    let ds = x(pos.x + dt) - x(pos.x)
    let pos_r_angle = V2(pos.x + dt, x(pos.x)).apply(transf)
    let tangent = plotf((_x) => ds / dt * (_x - pos.x) + x(pos.x), ax_opt).stroke("black").strokedasharray([10]).strokewidth(1.5)
    let actual_tangent = plotf((_x) => v(pos.x) * (_x - pos.x) + x(pos.x), ax_opt).stroke("red").strokewidth(1.5)
    let dt_annot = annotation.length(pos_t, pos_r_angle, "Δt", 0, 0.1, 0.2 * Math.sign(ds/dt)).stroke("blue").strokewidth(2).fontsize(20)
    let ds_annot = annotation.length(pos_dt, pos_r_angle, "Δs", 0, 0.1, -0.2 * Math.sign(ds/dt)).stroke("green").strokewidth(2).fontsize(20)

    let tangent_system = diagram_combine(l_vert_t, l_vert_dt, l_hor_t, l_hor_dt, tangent, actual_tangent, dt_annot, ds_annot)

    let ball = circle(0.1).position(V2(-0.6, x(pos.x)).apply(transf)).strokewidth(0).fill("lightblue")
    let velocity = arrow1(ball.origin, V2(-0.6, x(pos.x) + v(pos.x)).apply(transf), 0.1).fill("red").stroke("red").strokewidth(2)
    let velocity_emp = arrow1(ball.origin.add(V2(0.1, 0)), V2(-0.5, x(pos.x) + ds/dt).apply(transf), 0.1).fill("black").stroke("black").strokewidth(2).apply_to_tagged_recursive(TAG.ARROW_LINE, d => d.strokedasharray([10]))

    let v_exact = text(v(pos.x).toFixed(2)).fontfamily("Math").fontsize(20).position(V2(-1.5, 3.95))
    let v_empiric = text((ds/dt).toFixed(2)).fontfamily("Math").fontsize(20).position(V2(1, 3.95))

    draw(outline, ax, pos_plot, loc_bound, tangent_system, velocity, velocity_emp, ball, legend, v_exact, v_empiric)
}
int.slider("t", 0, 10, 6, 0.02, 10, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("Δt", 0.001, 2, 1, 0.001, 100, (name, value) => name + " = " + value.toFixed(3) + " s")

int.locator("pos", V2(0,0), 0.2, "blue", loc_bound, true)

int.draw()
int.draw()

if (typeof MathJax !== 'undefined' && MathJax.tex2svg) {
    draw_tex(outline.strokewidth(0), legend_tex)
}

int.locator_initial_draw()