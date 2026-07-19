import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, V2, bar, range_inc, TAG, plotf,
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

function calculateRandomFrequencies(c, n_log) {
    const totalStacks = Math.pow(10, n_log);
    const frequencies = new Array(c + 1).fill(0);

    for (let i = 0; i < totalStacks; i++) {
        let heads = 0;
        let remainingCoins = c;

        while (remainingCoins > 0) {
            let chunk = Math.min(remainingCoins, 30);
            remainingCoins -= chunk;

            let bits = Math.floor(Math.random() * (1 << chunk));

            while (bits > 0) {
                bits &= (bits - 1);
                heads++;
            }
        }
        frequencies[heads]++;
    }
    return frequencies;
}

function normalCurve(x, c, n_log) {
    const totalStacks = Math.pow(10, n_log)
    const mu = c * 0.5
    const sigma = 0.5 * Math.sqrt(c)

    const coefficient = totalStacks / (sigma * Math.sqrt(2 * Math.PI))
    const exponent = -0.5 * Math.pow((x - mu) / sigma, 2)

    return coefficient * Math.exp(exponent);
}

function getNiceMax(val) {
    if (val <= 0) return 10;

    let magnitude = Math.pow(10, Math.floor(Math.log10(val)));
    let fraction = val / magnitude;

    let niceMultiplier;
    if (fraction <= 1.2) niceMultiplier = 1.2;
    else if (fraction <= 1.5) niceMultiplier = 1.5;
    else if (fraction <= 2) niceMultiplier = 2.0;
    else if (fraction <= 3) niceMultiplier = 3.0;
    else if (fraction <= 5) niceMultiplier = 5.0;
    else niceMultiplier = 10.0;

    return niceMultiplier * magnitude;
}

let outline = rectangle(16, 9).strokewidth(0)

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let n_log = inp["log(n)"]
    let c = inp["c"]

    let data = calculateRandomFrequencies(c, n_log)

    let dataMax = Math.max(...data);
    let theoreticalPeak = normalCurve(c / 2, c, n_log);

    let targetMax = Math.max(dataMax, theoreticalPeak);
    let stableMaxY = getNiceMax(targetMax);

    let bar_op = {
        yrange: [0, stableMaxY],
        yticks: 10,
        bbox: [V2(-7, -4), V2(7, 4)],
        ticksize: 0.1
    }

    let ax_op = {
        xrange: [0, c],
        yrange: [0, stableMaxY],
        bbox: [V2(-7, -4), V2(7, 4)],
    }

    let dataplot = bar.plot(data, bar_op).strokewidth(0).fill("lightblue")
    let binom_plot = plotf(x => normalCurve(x, c, n_log), ax_op).strokedasharray([10])

    let y_ax = bar.yaxes(data, bar_op).apply_to_tagged_recursive(TAG.GRAPH_TICK_LABEL, d => d.translate(V2(-0.1, 0)))
    let x_ax = bar.xaxes(range_inc(0, c, 1).map((val) => val % (c > 60 ? 10 : c > 20 ? 5 : 2) === 0 ? String(val) : ""), bar_op)
    let axes = diagram_combine(y_ax, x_ax).fontfamily("Math").fontsize(20).stroke("black").textfill("black")

    draw(outline, dataplot, axes, binom_plot)
}

int.slider("log(n)", 1, 5, 2, 1, 10)
int.slider("c", 10, 100, 30, 1, 10)

int.draw()

let btn = document.getElementById("reroll");
btn.onclick = () => {
    int.draw();
}