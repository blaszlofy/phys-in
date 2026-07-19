import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    circle,
    V2,
    line,
    regular_polygon_side, rectangle_corner, mod, square, geometry, annotation, text, handle_tex_in_svg,
    draw_to_svg_element
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
let outline = rectangle(16, 9).strokewidth(0).opacity(0);

let divider = line(V2(-8, -2.6), V2(8, -2.6))

let rot_pos = V2(6, 1.5)
let pulley_pos = V2(-6, 3)

let bottom = line(V2(-1, 0), V2(1, 0)).strokewidth(3).stroke("lightgray")
let triangle = regular_polygon_side(3, 0.5).fill("lightgray").translate(V2(0, 0.15))
let rotator = diagram_combine(triangle, bottom).position(rot_pos).translate(V2(0, -0.3))

let top = line(V2(-1.5, 0), V2(1.5, 0)).strokewidth(3).stroke("lightgray")
let hang_rope = line(V2(0, 0), V2(0, -1))
let pulley_circle = circle(0.3).stroke("black").fill("lightgray").position(V2(0, -1))
let pulley = diagram_combine(hang_rope, top, pulley_circle).position(pulley_pos.sub(V2(0, -1)))

let block = rectangle_corner(rot_pos, pulley_pos.add(V2(0.3, rot_pos.y - pulley_pos.y + 0.2))).fill("lightblue").strokewidth(0)
let m_line = line(V2(rot_pos.x - 3, rot_pos.y), V2(pulley_pos.x + 0.3, rot_pos.y)).apply(mod.subdivide(3)).strokewidth(0)
let M_line = line(V2(rot_pos.x - 3, rot_pos.y + 0.2), V2(pulley_pos.x + 0.2 + 3, rot_pos.y + 0.2)).apply(mod.subdivide(2)).strokewidth(0)

let W_line = line(V2(pulley_pos.x - 0.3, pulley_pos.y - 3), V2(pulley_pos.x - 0.3, pulley_pos.y - 4)).apply(mod.subdivide(40)).strokewidth(0)

let W = 20;

let int = new Interactive(control, canvas);

let theta_cache = -1;
let M_cache = -1;
let m_ratio_cache = -1;
let M_ratio_cache = -1;
let m_cache = -1;

function detRatio(x) {
    const distances = [
        Math.abs(-6 - x),
        Math.abs(-3 - x),
        Math.abs(x),
        Math.abs(3 - x)
    ];
    const cases = [{string: "1", number: 1, tex: "1"}, {string: "¾", number: 3/4, tex: "\\frac{3}{4}"}, {string: "½", number: 1/2, tex: "\\frac{1}{2}"}, {string: "¼", number: 1/4, tex: "\\frac{1}{4}"}];
    const minIndex = distances.indexOf(Math.min(...distances));
    return cases[minIndex]
}

int.draw_function = (inp) => {
    let m = inp["m"]
    let M = inp["M"]
    let W_pos = inp["W_pos"]
    let m_pos = inp["m_pos"]
    let M_pos = inp["M_pos"]

    let m_ratio = detRatio(m_pos.x)
    let M_ratio = detRatio(M_pos.x)

    let dx = (W_pos.y - (pulley_pos.y - 3))
    let theta = Math.asin(dx/12)
    W = m_ratio.number * m + M_ratio.number * M

    block = rectangle_corner(rot_pos, pulley_pos.add(V2(0.3, rot_pos.y - pulley_pos.y + 0.2))).fill("lightblue").strokewidth(0).rotate(theta, rot_pos)
    m_line = line(V2(rot_pos.x - 3, rot_pos.y), V2(pulley_pos.x + 0.3, rot_pos.y)).apply(mod.subdivide(3)).strokewidth(0).rotate(theta, rot_pos)
    M_line = line(V2(rot_pos.x - 3, rot_pos.y + 0.2), V2(pulley_pos.x + 0.2 + 3, rot_pos.y + 0.2)).apply(mod.subdivide(2)).strokewidth(0).rotate(theta, rot_pos)

    let M_mass = square(0.3 * Math.cbrt(M)).strokewidth(0).fill("lightred")
        .combine(text(M.toString() + " kg").fontfamily("Math").fontsize(20)).position(M_pos).translate(V2(0, 0.15 * Math.cbrt(M))).rotate(theta)
    let m_mass = square(0.3 * Math.cbrt(m)).strokewidth(0).fill("lightcyan")
        .combine(text(m.toString() + " kg").fontfamily("Math").fontsize(20)).position(m_pos).translate(V2(0, -0.75))
    let m_rope = line(m_pos, m_mass.get_anchor("top-center"))
    let w_mass = square(0.3 * Math.cbrt(W)).strokewidth(0).fill("lightblue")
        .combine(text(W.toString() + " kg").fontfamily("Math").fontsize(20)).move_origin("top-center").position(W_pos)

    let rope1 = line(V2(pulley_pos.x - 0.3, pulley_pos.y), W_pos)
    let [p1, p2] =  geometry.circle_tangent_point_from_point(block.get_anchor("bottom-left"), pulley_circle.position(pulley_pos))
    let rope2 = line(p1, block.get_anchor("top-left").add(V2(0.03, -0.03)))

    //ANNOTATION
    let dist_line_1 = line(V2(m_pos.x + 0.5, 0.75 - 0.15 * Math.cbrt(m)), V2(m_pos.x - 0.5, 0.75 - 0.15 * Math.cbrt(m))).strokedasharray([10]).stroke("gray")
    let dist_line_2 = line(V2(M_pos.x + 0.5, 1.7), V2(M_pos.x - 0.5, 1.7)).strokedasharray([10]).stroke("gray")
    let dist_line_3 = line(V2(pulley_pos.x - 0.3 - 0.15 * Math.cbrt(W) + 0.5, pulley_pos.y - 3), V2(pulley_pos.x - 0.3 - 0.15 * Math.cbrt(W) - 0.5, pulley_pos.y - 3)).strokedasharray([10]).stroke("gray")

    let annot_W = annotation.length(V2(pulley_pos.x - 0.3 - 0.15 * Math.cbrt(W), pulley_pos.y - 3), V2(pulley_pos.x - 0.3 - 0.15 * Math.cbrt(W), pulley_pos.y - 3 + dx), "Δx", 0, 0.1, 0.3)
        .stroke("gray").fontfamily("Math").fontsize(20).strokewidth(1.5)
    let annot_M = annotation.length(V2(M_pos.x, 1.7), M_pos,  M_ratio.string + " Δx", 0, 0.1, -0.4)
        .stroke("gray").fontfamily("Math").fontsize(20).strokewidth(1.5)
    let annot_m = annotation.length(dist_line_1.get_anchor("center-center"), m_mass.get_anchor("bottom-center"),  ((m_ratio.string === "1") ? "" : m_ratio.string) + " Δx", 0, 0.1, -0.4)
        .stroke("gray").fontfamily("Math").fontsize(20).strokewidth(1.5)
    let annot = diagram_combine(annot_M, annot_W, annot_m, dist_line_1, dist_line_2, dist_line_3)

    if (m_ratio_cache !== m_ratio.number || M_ratio_cache !== M_ratio.number || m_cache !== m || M_cache !== M) {
        //TEXT
        let red_sq = square(0.3).fill("lightred").strokewidth(0)
        let cyan_sq = square(0.3).fill("lightcyan").strokewidth(0).translate(V2(2, 0))
        let blue_sq = square(0.3).fill("lightblue").strokewidth(0).translate(V2(4, 0))
        let red = text("$$" + M_ratio.tex + " \\cdot " + M.toString() + "\\text{ kg}$$").fontfamily("Math").fontsize(18).translate(V2(0.8, 0.03))
        let cyan = text("$$" + m_ratio.tex + " \\cdot " + m.toString() + "\\text{ kg}$$").fontfamily("Math").fontsize(18).translate(V2(2.8, 0.03))
        let blue = text("$$" + W.toString() + "\\text{ kg}$$").fontfamily("Math").fontsize(18).translate(V2(4.7, -0.02))
        let plus = text("+").fontfamily("Math").fontsize(20).translate(V2(1.6, 0))
        let equal = text("=").fontfamily("Math").fontsize(20).translate(V2(3.6, 0))
        let calculator = diagram_combine(red_sq, red, plus, cyan_sq, cyan, equal, blue_sq, blue).position(V2(-2.5, -3.4))

        if (typeof MathJax !== 'undefined' && MathJax.tex2svg) {
            draw_tex(outline, calculator)
            m_ratio_cache = m_ratio.number
            M_ratio_cache = M_ratio.number
            m_cache = m
            M_cache = M
        }
    }

    if (theta_cache !== theta) {
        theta_cache = theta
        int.remove_locator("m_pos")
        int.remove_locator("M_pos")
        int.locator("m_pos", m_pos, 0.2, "cyan", m_line)
        int.locator("M_pos", M_pos, 0.2, "red", M_line)
    }

    draw(outline, divider, rope1, rope2, m_rope, rotator, pulley, W_line, w_mass, block, m_line, M_line, M_mass, m_mass, (dx !== 0) ? annot : square(0))
}

int.locator("m_pos", V2(3, 0), 0.2, "cyan", m_line)
int.locator("M_pos", V2(-3, 0), 0.2, "red", M_line)
int.locator("W_pos", V2(0, 0), 0.2, "blue", W_line)

function massFormat(name, value) {
    return (name + " = " + value + " kg");
}

int.slider("M", 10, 100, 60, 10, 10, massFormat)
int.slider("m", 10, 50, 30, 10, 10, massFormat)

int.draw()
int.locator_initial_draw()