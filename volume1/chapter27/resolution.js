import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, line, V2, circle, text, mod, annotation, curve
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

//SOME FUNCTION FROM THE WEB TO GET THE COLOR BASED ON FREQUENCY IN THZ
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

const h = 1.5
const c = 2

//STATIC
let outline = rectangle(16, 9).strokewidth(0)
let opt_ax = line(V2(-8, 0), V2(8, 0)).stroke("lightgray").strokedasharray([10])
let lens_bound = line(V2(-4, 0), V2(0, 0)).apply(mod.subdivide(200))
let P = circle(0.05).strokewidth(0).fill("lightblue").position(V2(-6.5, 0))
let P_text = text("P").fontsize(20).fontfamily("Math").position(V2(-6.5, -0.3))
let T = circle(0.05).strokewidth(0).fill("lightred").position(V2(6.5, 0))
let T_text = text("T").fontsize(20).fontfamily("Math").position(V2(6.5, -0.3))
let stat = diagram_combine(opt_ax, P, P_text, T, T_text)

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let D = inp["D"] / 100
    let lens_x = inp["lens"].x
    let v = inp["ν"]
    let t = inp["t"]

    let P__text = text("P'").fontsize(20).fontfamily("Math").position(V2(-6.5, D + 0.3))
    let P_ = circle(0.05).strokewidth(0).fill("blue").position(V2(-6.5, D))

    let theta = Math.atan2(h, Math.abs(lens_x - P.get_anchor("center-center").x));

    let lens = line(V2(lens_x, -h), V2(lens_x, h)).strokewidth(2).strokelinecap("round").stroke("blue")

    let annot = [
        annotation.length(P.get_anchor("center-center"), P_.get_anchor("center-center"), "D", -0.2, 0.1, -0.4).stroke("blue"),
        annotation.angle([V2(lens_x, 0), P.get_anchor("center-center"), lens.get_anchor("top-center")], "θ", 0.6, 0.8).strokewidth(0).fill("lightblue")
    ]

    let lightrays = [
        line(P.get_anchor("center-center"), lens.get_anchor("top-center")).strokedasharray([10]).stroke("gray"),
        line(P.get_anchor("center-center"), lens.get_anchor("bottom-center")).strokedasharray([10]).stroke("gray"),
    ]
    let p_top = curve([P_.get_anchor("center-center"), lens.get_anchor("top-center"), T.get_anchor("center-center")]).stroke("gray")
    let p_bottom = curve([P_.get_anchor("center-center"), lens.get_anchor("bottom-center"), T.get_anchor("center-center")]).stroke("gray")

    lightrays.push(p_top, p_bottom)

    let waves = []
    let visual_lambda = c / v * 100

    let L_top = p_top.path_length()
    let L_bottom = p_bottom.path_length()

    let wave = line(V2(0, -0.1), V2(0, 0.1)).stroke(getLightColor(v)).strokewidth(1.5)

    let offset = (c * t) % visual_lambda

    for (let d = offset; d <= L_top; d += visual_lambda) {
        let s = d / L_top
        let pt = p_top.parametric_point(s)
        waves.push(wave.position(pt).rotate(pt.sub(p_top.parametric_point(Math.min(s + 0.001, 1))).angle()))
    }

    for (let d = offset; d <= L_bottom; d += visual_lambda) {
        let s = d / L_bottom
        let pt = p_bottom.parametric_point(s)
        waves.push(wave.position(pt).rotate(pt.sub(p_bottom.parametric_point(Math.min(s + 0.001, 1))).angle()))
    }

    let D_req = visual_lambda / (2 * Math.sin(theta))
    let resolved = (L_bottom - L_top) >= visual_lambda;

    let notice = text("Point sources " + (resolved ? "resolved" : "unresolved")).fontsize(20).fontfamily("Math").position(V2(4, -3.5))
    let val = text(D_req.toFixed(2)).fontsize(20).fontfamily("Math").position(V2(-2.05, -3.43))

    let legend = diagram_combine(
        wave.position(V2(-3.5, 3.5)),
        wave.position(V2(-3.5 - visual_lambda, 3.5)),
        wave.position(V2(-3.5 - 2 * visual_lambda, 3.5)),
        wave.position(V2(-3.5 - 3 * visual_lambda, 3.5)),
        text("Light paths with markers spaced by one period of oscillation (wavelength λ)").fontsize(20).fontfamily("Math").position(V2(1.2, 3.5)),
        text("Lens, which focuses P to T").fontsize(20).fontfamily("Math").position(V2(0.1, 4)),
        line(V2(0, -0.2), V2(0, 0.2)).strokewidth(2).strokelinecap("round").stroke("blue").position(V2(-1.7, 4)),

        line(V2(-8, 2.7), V2(8, 2.7)),
        line(V2(-8, -2.5), V2(8, -2.5)),

        text("Assumes index of refraction n = 1 (air)").fontsize(16).fontfamily("Math").position(V2(-3.35, -4.1)),
    )

    draw(outline, P_, P__text, lens, ...annot, ...lightrays, stat, ...waves, notice, val, legend)
}

int.locator("lens", V2(-2.5, 0), 0.2, "gray", lens_bound)

int.slider("t", 0, 10, 0, 0.02, 10, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("D", 1, 100, 50, 1, 10, (name, value) => name + " = " + (value / 100).toFixed(2) + " m")
int.slider("ν", 400, 780, 600, 1, 10, (name, value) => name + " = " + value.toFixed(0) + " THz")

int.draw()
int.draw()

//TEX
let eq = text("$$D_{limit} = \\frac{\\lambda}{2 \\text{n} \\sin(\\theta)} = $$").fontsize(18).position(V2(-3.95, -3.5))
draw_tex(outline, eq)