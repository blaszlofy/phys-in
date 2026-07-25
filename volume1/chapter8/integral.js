import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, xycorneraxes, plotf, line, mod, axes_transform, annotation, circle, arrow1, text,
    rectangle_corner, TAG, xyaxes, under_curvef
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

const get_riemann_rectangles = (v, dt, t, transform) => {
    let rectangles = []
    let areas = []
    dt = Math.max(0.01, dt)

    for (let current_t = 0; current_t < t; current_t += dt) {
        let step = Math.min(dt, t - current_t)
        let height = v(current_t)
        areas.push(height * step)
        let bottom_left = V2(current_t, 0).apply(transform)
        let top_right = V2(current_t + step, height).apply(transform)

        let rect = rectangle_corner(bottom_left, top_right).fill("lightblue").strokewidth(0).opacity(0.6)

        rectangles.push(rect)
    }

    return {rectangles: rectangles, areas: areas};
};

//STATIC
let outline = rectangle(16, 9).strokewidth(0);
let ax_opt = {
    xrange: [0, 10],
    yrange: [-3, 6],
    bbox: [V2(-6, -4), V2(7.5, 3)],
    headsize: 0.1
}
let transf = axes_transform(ax_opt)
const x = time => -0.000000990783437*time**10 + 0.000021037529294*time**9 + 0.000202274791939*time**8 - 0.010202611835379*time**7 + 0.124504873380118*time**6 - 0.717861769721937*time**5 + 2.003475042584663*time**4 - 1.958550419885061*time**3 - 1.628181199973283*time**2 + 4.186593763913083*time
const v = time => -0.00000990783437*time**9 + 0.000189337763646*time**8 + 0.001618198335512*time**7 - 0.071418282847653*time**6 + 0.747029240280708*time**5 - 3.589308848609685*time**4 + 8.013900170338652*time**3 - 5.875651259655183*time**2 - 3.256362399946566*time + 4.186593763913083
let ax = xyaxes(ax_opt).stroke("black").fill("black").textfill("black").fontfamily("Math").fontsize(20)
let pos_plot = plotf((t) => v(t), ax_opt).stroke("lightblue").strokewidth(3)
let loc_bound = line(V2(0, 0).apply(transf), V2(ax_opt.xrange[1], 0).apply(transf)).strokewidth(0).apply(mod.subdivide(400))

let rul_opt = {
    xrange: [0, 0.001],
    yrange: [0, 7.5],
    xticks: [0],
    bbox: [V2(-1.2, 0).apply(transf), V2(-1.2, 7.5).apply(transf)],
    headsize: 0
}
let rul = xyaxes(rul_opt).stroke("black").fill("black").textfill("black").fontfamily("Math").fontsize(20)

let dist_limit = text("$$s = \\int v(t) dt = $$").fontsize(20).position(V2(-8, 9.9))
let rect = rectangle_corner(dist_limit.bounding_box()[0], dist_limit.bounding_box()[1])
let dist = text("$$\\sum_{i} v(t_{i})\\Delta t = $$").fontsize(20).position(V2(-2, 9.7))
let legend_tex = diagram_combine(dist_limit, dist, rect)

let v_leg = text("v (m/s)").fontfamily("Math").fontsize(20).position(V2(-6, 3.2))
let s_leg = text("s (m)").fontfamily("Math").fontsize(20).position(V2(-7.55, 4.35))
let t_leg = text("t (s)").fontfamily("Math").fontsize(20).position(V2(7.6, -1.3))
let exact_line = line(V2(0, 0), V2(0, 0.5)).position(V2(-4.9, 3.7)).stroke("red").strokewidth(1.5)
let emp_line = line(V2(0, 0), V2(0, 0.5)).position(V2(-1.3, 3.75)).stroke("black").strokewidth(1.5).strokedasharray([10])
let exact_line2 = line(V2(0, 0), V2(0.45, 0)).position(V2(2.3, 4.2)).stroke("red").strokewidth(1.5)
let emp_line2 = line(V2(0, 0), V2(0.5, 0)).position(V2(2.3, 3.7)).stroke("black").strokewidth(1.5).strokedasharray([10])
let exact = text("Actual position of the ball").fontfamily("Math").fontsize(20).position(V2(4.35, 4.2))
let emp = text("Approximated position by summing").fontfamily("Math").fontsize(20).position(V2(5, 3.7))
let emp2 = text("up the areas of the blue rectangles").fontfamily("Math").fontsize(20).position(V2(4.87, 3.35))
let legend = diagram_combine(v_leg, t_leg, s_leg, exact_line, emp_line, exact_line2, emp_line2, exact, emp, emp2)

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

    let ball = circle(0.2).position(V2(-0.8, x(pos.x)).apply(transf)).strokewidth(0).fill("lightblue")
    let ball_line = line(V2(-1.3, x(pos.x)).apply(transf), ball.origin).stroke("red").strokewidth(1.5)

    let riemann = get_riemann_rectangles(v, dt, pos.x, transf)
    let rect = []
    if (dt > 0.04) {
        rect = riemann.rectangles
    } else {
        rect = [under_curvef(v, 0, pos.x, ax_opt).fill("lightblue").opacity(0.6).strokewidth(0)]
    }

    let approx_area = 0
    for (let a of riemann.areas) {
        approx_area += a
    }

    let ghost_ball = circle(0.2).position(V2(-0.8, approx_area).apply(transf)).strokewidth(0).fill("#d6e3f3")
    let ghost_ball_line = line(V2(-1.3, approx_area).apply(transf), ghost_ball.origin).stroke("black").strokewidth(1.5).strokedasharray([10])

    let s_exact = text(x(pos.x).toFixed(2)).fontfamily("Math").fontsize(20).position(V2(-2.5, 3.96))
    let s_empiric = text((approx_area).toFixed(2)).fontfamily("Math").fontsize(20).position(V2(1, 3.96))

    draw(outline, ax, ...rect, pos_plot, loc_bound, legend, rul, ghost_ball_line, ghost_ball, ball_line, ball, s_exact, s_empiric)
}
int.slider("t", 0, 10, 6, 0.02, 10, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("Δt", 0.001, 1.01, 1, 0.001, 100, (name, value) => name + " = " + value.toFixed(3) + " s")

int.locator("pos", V2(0,0), 0.2, "blue", loc_bound, true)

int.draw()
int.draw()

if (typeof MathJax !== 'undefined' && MathJax.tex2svg) {
    draw_tex(outline.strokewidth(0), legend_tex)
}

int.locator_initial_draw()