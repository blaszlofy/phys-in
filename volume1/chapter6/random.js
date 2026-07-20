import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, V2, xyaxes, plotv, line, axes_transform, text, distribute_vertical_and_align,
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

function generatePath(n) {
    let path = Array(n + 1).fill(0)
    path[0] = V2(0, 0)
    for (let i = 1; i < n + 1; i++) {
        let random = [-1, 1][Math.round(Math.random())]
        path[i] = path[i - 1].add(V2(random, 1))
    }
    return path;
}

let paths = []
let plots = []
let regenerate = false

//STATIC
let outline = rectangle(16, 9).strokewidth(0);

let lin = line(V2(0, 0), V2(0.5, 0)).strokedasharray([10])
let lintext = text("Theoretical RMS distance (√n)").fontfamily("Math").fontsize(20).translate(V2(2.4, 0))
let reallin = line(V2(0, 0), V2(0.5, 0)).stroke("lightred").strokewidth(3)
let reallintext = text("Empirical RMS distance").fontfamily("Math").fontsize(20).translate(V2(2.03, 0))
let legend = distribute_vertical_and_align([
    diagram_combine(lin, lintext),
    diagram_combine(reallin, reallintext)
], 0.4, "left").position(V2(3, -3))


let int = new Interactive(control, canvas);

let s_cache = -1;
let n_cache = -1;
int.draw_function = (inp) => {
    let n = inp["n"]
    let p = inp["p"]

    let ax_opt = {
        xrange: [-n, n],
        yrange: [0, n],
        bbox: [V2(-7.5, -4), V2(7.5, 3.5)],
        headsize: 0.1,
    }
    let transf = axes_transform(ax_opt)

    let required = regenerate ? p : 1;

    if (s_cache !== n) {
        s_cache = n
        required = p
    }

    if (n_cache !== p) {
        n_cache = p
        paths = []
        plots = []
        required = p
    }

    for (let i = 1; i <= required; i++) {
        let new_path = generatePath(n)

        if (paths.length >= p) {
            paths.shift()
            plots.shift()
        }
        paths.push(new_path)
        plots.push(plotv(new_path, ax_opt).stroke("lightblue").opacity(0.5))
    }

    let sum_sq = 0;
    for (let path of paths) {
        sum_sq += Math.pow(path[n].x, 2);
    }
    let avg_sq = sum_sq / paths.length;
    let rms = Math.sqrt(avg_sq);
    let ax_avg = V2(rms, 0).apply(transf).x
    let real_ax_avg = V2(Math.sqrt(n), 0).apply(transf).x

    let line_minus = line(V2(-ax_avg, -4.5), V2(-ax_avg, 4))
    let line_plus = line(V2(ax_avg, -4.5), V2(ax_avg, 4))
    let lines = diagram_combine(line_minus, line_plus).stroke("lightred").strokewidth(3)

    let real_minus = line(V2(-real_ax_avg, -4.5), V2(-real_ax_avg, 4))
    let real_plus = line(V2(real_ax_avg, -4.5), V2(real_ax_avg, 4))
    let real_lines = diagram_combine(real_minus, real_plus).strokedasharray([10])

    let axes = xyaxes(ax_opt).stroke("black").fill("black").fontfamily("Math").fontsize(20).textfill("black")

    regenerate = false

    draw(outline, axes, ...plots, real_lines, lines, legend)
}

function format(name, value) {
    return (name + " = " + value);
}

int.slider("n", 20, 200, 25, 1, 10, format)
int.slider("p", 1, 30, 15, 1, 10, format)

int.draw()
int.draw()

let gen = document.getElementById("generate");
gen.onclick = () => {
    int.draw();
}

let regen = document.getElementById("regenerate");
regen.onclick = () => {
    regenerate = true
    int.draw();
}