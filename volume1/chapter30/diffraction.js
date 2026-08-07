import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, V2, axes_transform, arrow1, xyaxes, xycorneraxes, line, TAG, ytickmark, xtickmark, plotf, circle,
    text, arc, annotation, mod, curve
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

const A = 1
const center = V2(2, -1.65)

let ax1_opt = {
    xrange: [-3, 10],
    yrange: [-8, 8],
    xticks: [],
    yticks: [],
    bbox: [V2(-7.8, -1.7), V2(-2.925, 4.3)],
    headsize: 0.1,
}
let transf1 = axes_transform(ax1_opt)

let ax2_opt = {
    xrange: [0, Math.PI / 4 + 0.01],
    yrange: [0, 1.3],
    yticks: [],
    xticks: [],
    bbox: [V2(-7, -4), V2(7.5, -2)],
    headsize: 0.1,
    n_sample: 400,
}
let transf2 = axes_transform(ax2_opt)

let outline = rectangle(16, 9).strokewidth(0);

let ax1 = xyaxes(ax1_opt).fontfamily("Math").fontsize(20).stroke("black").fill("black").textfill("black")
let ax2 = xycorneraxes(ax2_opt).fontfamily("Math").fontsize(20).stroke("black").fill("black").textfill("black")
let ticktop = ytickmark(1, 0, "I/n²I₀", ax2_opt).fontfamily("Math").fontsize(20).textfill("black").stroke("black")
    .apply_to_tagged_recursive(TAG.GRAPH_TICK_LABEL, d => d.translate(V2(-0.1, 0.35)))
let ticktop1 = ytickmark(1, 0, "1", ax2_opt).fontfamily("Math").fontsize(20).textfill("black").stroke("black")
    .apply_to_tagged_recursive(TAG.GRAPH_TICK_LABEL, d => d.translate(V2(-0.1, 0)))
let xtick1 = xtickmark(Math.PI / 8, 0, "π/8", ax2_opt).fontfamily("Math").fontsize(20).textfill("black").stroke("black")
    .apply_to_tagged_recursive(TAG.GRAPH_TICK_LABEL, d => d.translate(V2(0, -0.1)))
let xtick2 = xtickmark(Math.PI / 16, 0, "π/16", ax2_opt).fontfamily("Math").fontsize(20).textfill("black").stroke("black")
    .apply_to_tagged_recursive(TAG.GRAPH_TICK_LABEL, d => d.translate(V2(0, -0.1)))
let xtick3 = xtickmark(Math.PI / 4, 0, "π/4", ax2_opt).fontfamily("Math").fontsize(20).textfill("black").stroke("black")
    .apply_to_tagged_recursive(TAG.GRAPH_TICK_LABEL, d => d.translate(V2(0, -0.1)))
let xtick4 = xtickmark(Math.PI * 3 / 16, 0, "3π/16", ax2_opt).fontfamily("Math").fontsize(20).textfill("black").stroke("black")
    .apply_to_tagged_recursive(TAG.GRAPH_TICK_LABEL, d => d.translate(V2(0, -0.1)))

let div1 = line(V2(-8, -1.9), V2(8, -1.9))
let div2 = line(V2(-2.5, -1.9), V2(-2.5, 4.5))
let div3 = line(V2(-2.5, 2.6), V2(8, 2.6))

let x_lab = text("x").fontsize(20).fontfamily("Math").position(V2(-2.75, 1.3))
let y_lab = text("y").fontsize(20).fontfamily("Math").position(V2(-6.4, 4.3))
let theta_lab = text("θ").fontsize(20).fontfamily("Math").position(V2(7.8, -4.015))

const sub = 20
let middle = line(V2(center.x, center.y - 0.2), V2(center.x, center.y + 4.2)).strokewidth(1.5).stroke("gray").strokedasharray([10])

//TRICKERY TO FIGHT THIS LIBRARY
let bound_points = arc(4, Math.PI / 4).apply(mod.subdivide(sub)).path.points
for (let i = 0; i < 20; i++) {
    bound_points.pop()
}
let bound = curve(bound_points).position(center).rotate(Math.PI / 4).strokewidth(1.5).stroke("gray").strokedasharray([10])

let stat = diagram_combine(ax1, ax2, div1, div2, div3, ticktop, xtick1, xtick2, xtick3, xtick4, ticktop1, x_lab, y_lab, theta_lab)

let marker = diagram_combine(
    line(V2(0, 0), V2(0, 0.3)).strokewidth(2).stroke("lightred"),
    line(V2(-0.3, 0), V2(-0.3, 0.3)).strokewidth(2).stroke("lightred"),
).position(V2(-2, 4))
let marker_t = text("Markers spaced out by one wavelength λ").fontfamily("Math").fontsize(20).position(V2(0.6, 4.15))
let pl = line(V2(0, 0), V2(0.5, 0)).stroke("lightblue").strokewidth(2).position(V2(-2.38, 3.5))
let pl_t = text("Intensity pattern from n sources (normalized)").fontfamily("Math").fontsize(20).position(V2(0.95, 3.5))
let ar = arrow1(V2(0, 0), V2(0.5, 0), 0.1).stroke("blue").fill("blue").strokewidth(2).position(V2(-2.38, 2.9))
let ar_t = text("Resultant amplitude from the geometric addition of n 'amplitude vectors'").fontfamily("Math").fontsize(20).position(V2(2.5, 2.9))

let leg = diagram_combine(marker, marker_t, pl, pl_t, ar, ar_t).translate(V2(0.5, 0))

let int = new Interactive(control, canvas);

function generateVectors(n, phi) {
    let start = V2(0, 0)
    let end = V2(A, 0)

    let vectors = []
    for (let i = 1; i <= n; i++) {
        vectors.push(arrow1(start.apply(transf1), end.apply(transf1), 0.05).fill("gray").stroke("gray").strokewidth(1))

        start = end
        end = end.add(V2(A, 0).rotate(phi * i))
    }
    vectors.push(arrow1(V2(0, 0).apply(transf1), start.apply(transf1), 0.1).fill("blue").stroke("blue").strokewidth(2))
    return vectors
}

let intensity
let n_cache = 0
let d_cache = 0
int.draw_function = (inp) => {
    let n = inp["n"]
    let d = inp["d"]
    let p = inp["p"]

    let d_vis = d / 20
    let lambda_vis = 2 * Math.PI / 20

    let dir = p.sub(center).normalize()
    let ln = line(center.add(dir.scale(-0.2)), p.add(dir.scale(0.2))).strokewidth(1.5).stroke("gray").strokedasharray([10])
    let ang = annotation.angle([p, center, center.add(V2(0, 1))], "θ", 0.5, 0.8).strokewidth(0).fill("lightblue")

    let theta = Math.PI / 2 - dir.angle()

    let phi = d * Math.sin(theta)

    let vectors = generateVectors(n, phi)

    let start = center.x - (n - 1) * d_vis / 2

    let last = V2(start + (n - 1) * d_vis, center.y)
    let perp = line(last, last.add(dir.rotate(Math.PI / 2).scale((n - 1) * d_vis * Math.cos(theta)))).stroke("lightgray").strokewidth(1.5)

    let dir_p = dir.rotate(Math.PI / 2)
    let charges = []
    let lines = []
    for (let i = 0; i < n; i++) {
        let pos = V2(start + d_vis * i, center.y)
        charges[i] = circle(0.03).strokewidth(0).fill("red").position(pos)
        let sc = Math.sin(theta) * d_vis * (n - i - 1) + 0.3
        lines.push(
            line(pos.add(dir.scale(-0.1)), pos.add(dir.scale(sc))).stroke("lightgray").strokewidth(1.5),
            line(pos.add(dir.scale(sc)), pos.add(dir.scale(sc + 0.7))).stroke("lightgray").strokewidth(1.5).strokedasharray([10]),
        )
        let num = Math.floor(sc / lambda_vis)
        for (let j = 1; j <= num; j++) {
            let w = dir.scale(j * lambda_vis).add(pos)
            lines.push(
                line(w.add(dir_p.scale(0.1)), w.add(dir_p.scale(-0.1))).stroke("lightred").strokewidth(2)
            )
        }
    }

    if (n_cache !== n || d_cache !== d) {
        n_cache = n
        d_cache = d
        intensity = plotf(x => (Math.sin(n * d * Math.sin(x) / 2)**2 / Math.sin(d * Math.sin(x) / 2)**2) / n**2, ax2_opt).strokewidth(2).stroke("lightblue")
    }

    let timeline = line(V2(theta, 0).apply(transf2), V2(theta, 1).apply(transf2)).stroke("gray").strokedasharray([10])
    let val = circle(0.05).strokewidth(0).fill("blue").position(V2(theta, (Math.sin(n * phi / 2)**2 / Math.sin(phi / 2)**2) / n**2).apply(transf2))

    draw(outline, stat, ...vectors, intensity, timeline, val, ang, middle, bound, ln, perp, ...lines, ...charges, leg)
}

int.slider("n", 1, 8, 6, 1, 10, (name, value) => name + " = " + value.toFixed(0))
int.slider("d", 5, 20, 15, 1, 10, (name, value) => name + " = " + value.toFixed(0) + " mm")

int.locator("p", V2(4.85, 4), 0.2, "blue", bound)

int.draw()
int.draw()