import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, arrow1, line, V2, mod, axes_transform, xyaxes, plotf, circle, text
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
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

function fresnel_intensity(u) {
    let steps = 150
    let du = Math.abs(u) / steps
    let sumC = 0
    let sumS = 0

    for(let i = 0; i < steps; i++) {
        let v = (i + 0.5) * du
        let theta = (Math.PI / 2) * v * v
        sumC += Math.cos(theta) * du
        sumS += Math.sin(theta) * du
    }

    if (u < 0) {
        sumC = -sumC
        sumS = -sumS
    }

    return 0.5 * (Math.pow(0.5 + sumC, 2) + Math.pow(0.5 + sumS, 2))
}

const sc_top = V2(-1, 4.3)
const sc_bottom = V2(-1, -0.3)

let outline = rectangle(16, 9).strokewidth(0);

let div1 = line(V2(-8, -0.5), V2(8, -0.5))
let div2 = line(V2(1.3, 4.5), V2(1.3, -0.5))

let screen = line(sc_top, sc_bottom).strokewidth(2)
let bound = line(sc_top, sc_bottom).apply(mod.subdivide(200))

let ax_opt = {
    xrange: [-5, 5],
    yrange: [0, 1.5],
    xticks: [],
    yticks: [],
    bbox: [V2(sc_bottom.y, 0), V2(sc_top.y, 1.5)],
    headsize: 0.1,
    n_sample: 200,
}
let transf = axes_transform(ax_opt)
let ax = xyaxes(ax_opt).fill("black").stroke("black")

let li_t = text("Incoming light from a distant source").fontsize(20).fontfamily("Math").position(V2(4.49, 4.1))
let op = line(V2(0, 0), V2(0.5, 0)).stroke("lightgray").strokewidth(30).position(V2(1.6, 3.5))
let op_t = text("Opaque object").fontsize(20).fontfamily("Math").position(V2(3.2, 3.5))
let sc = line(V2(0, 0), V2(0.5, 0)).stroke("black").strokewidth(2).position(V2(1.6, 2.9))
let sc_t = text("Screen at distance s behind the object").fontsize(20).fontfamily("Math").position(V2(4.52, 2.9))
let ip = line(V2(0, 0), V2(0.5, 0)).stroke("blue").strokewidth(2).position(V2(1.6, 2.3))
let ip_t = text("Intensity pattern on the screen").fontsize(20).fontfamily("Math").position(V2(4.16, 2.3))
let c = arrow1(V2(0, 0), V2(0.5, 0), 0.05).stroke("black").strokewidth(1).position(V2(1.6, 1.7))
let c_t = text("'Amplitude vectors' from the many").fontsize(20).fontfamily("Math").position(V2(4.37, 1.7))
let c_t2 = text("secondary sources 'imagined'").fontsize(20).fontfamily("Math").position(V2(4.11, 1.3))
let c_t3 = text("in open-space above the opaque object").fontsize(20).fontfamily("Math").position(V2(4.61, 0.9))

let I = text("I/I₀").fontsize(20).fontfamily("Math").position(V2(1, 1.7))
let x = text("x").fontsize(20).fontfamily("Math").position(V2(-0.3, 0))

let stat = diagram_combine(div1, screen, div2, I, x, diagram_combine(li_t, op, op_t, sc, sc_t, ip, ip_t, c, c_t, c_t2, c_t3).translate(V2(0.4, -0.5)))

let int = new Interactive(control, canvas);

function create_cornu_vectors(v_start, v_end, n, active_v_min, scale = 5) {
    let vecs = []
    let curr = V2(0, 0)
    let dv = (v_end - v_start) / n
    let a_start = null
    let a_end = null

    const ROTATION = -Math.PI / 4;

    for (let i = 0; i <= n; i++) {
        let v = v_start + i * dv

        let theta = (Math.PI / 2) * (v * v) + ROTATION;

        let next = curr.add(V2(Math.cos(theta) * scale, Math.sin(theta) * scale).scale(dv))
        let is_active = (v >= active_v_min)

        if (is_active && !a_start) a_start = curr
        if (is_active) a_end = next

        if (is_active) {
            vecs.push(arrow1(curr, next, 0.05).stroke("black").fill("black").strokewidth(1))
        } else {
            vecs.push(arrow1(curr, next, 0.05).stroke("lightgray").fill("lightgray").strokewidth(1).opacity(0.25))
        }

        curr = next
    }

    if (a_start && a_end) {
        vecs.push(arrow1(a_start, a_end, 0.15).strokewidth(2).fill("blue").stroke("blue"))
    }

    return diagram_combine(...vecs)
}

int.draw_function = (inp) => {
    let y = ((inp["x"].y - sc_bottom.y) / (sc_top.y - sc_bottom.y)) * 10 - 5
    let lambda = inp["λ"] / 250
    let s = inp["s"]

    const scale = Math.sqrt(2 / (s * lambda))

    let u = y * scale

    let cornu = create_cornu_vectors(-6, 6, 100, -u).position(V2(-4, -2.2))

    let timeline = line(V2(-y, 0).apply(transf), V2(-y, 1.5).apply(transf)).strokedasharray([10]).stroke("gray")
    let val = circle(0.05).strokewidth(0).fill("blue").position(V2(-y, fresnel_intensity(u)).apply(transf))
    let intensity = plotf(x => fresnel_intensity(-x * scale), ax_opt).stroke("blue").strokewidth(2)
    let pl = diagram_combine(ax, intensity, timeline, val).move_origin("bottom-center").position(sc_bottom.add(sc_top).scale(0.5).add(V2(0.4, 0))).rotate(-Math.PI / 2)

    let opaque = line(V2(sc_bottom.x - s * 2, sc_bottom.y - 0.2), V2(sc_top.x - s * 2, sc_top.y - (sc_top.y - sc_bottom.y) / 2))
        .strokewidth(30).stroke("lightgray")

    let col = getLightColor(299792 / inp["λ"])
    let light = []
    for (let i = 0; i < 10; i++) {
        let y = -0.2 + 4.85 / 10 * i
        light.push(arrow1(V2(-7.95, y), V2(-7.4, y), 0.05).stroke(col).fill(col).strokewidth(2))
    }
    let li = arrow1(V2(0, 0), V2(0.5, 0), 0.05).stroke(col).fill(col).strokewidth(2).position(V2(1.6, 4.1)).translate(V2(0.4, -0.5))

    let p = text("P").fontfamily("Math").fontsize(20).position(inp["x"].add(V2(-0.5, 0)))

    draw(outline, opaque, stat, cornu, pl, ...light, li, p)
}

int.slider("λ", 390, 750, 460, 1, 10, (name, value) => name + " = " + value.toFixed(0) + " nm")
int.slider("s", 1, 3, 2, 0.1, 10, (name, value) => name + " = " + value.toFixed(1) + " m")

int.locator("x", V2(0, 3), 0.2, "blue", bound)

int.draw()
int.draw()