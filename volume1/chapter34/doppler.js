import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, square, V2, circle, line, text,
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

function getLightColor(freq) {
    const nm = 299792 / freq;

    let r = 0, g = 0, b = 0;

    if ( nm < 380) {
        r = 1.0
        g = 0.58
        b = 0.957
    } else if (nm >= 380 && nm < 440) {
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

const c = 2;

let div = line(V2(-8, -1), V2(8, -1))

let leg = diagram_combine(
    circle(0.15).strokewidth(0).fill("lightred").position(V2(-7, -1.7)),
    text("Emitter, traveling at speed v₁").fontfamily("Math").fontsize(20).position(V2(-4.8, -1.7)),
    square(0.3).strokewidth(0).fill("lightblue").position(V2(-7, -2.4)),
    text("Observer, traveling at speed v₂").fontfamily("Math").fontsize(20).position(V2(-4.7, -2.4)),
    diagram_combine(
        line(V2(0, -0.2), V2(0, 0.2)),
        line(V2(-0.3, -0.2), V2(-0.3, 0.2)),
        line(V2(0.3, -0.2), V2(0.3, 0.23)),
    ).position(V2(-7.2, -3.15)),
    text("Wave crests of the emitted light").fontfamily("Math").fontsize(20).position(V2(-4.65, -3.15)),
    diagram_combine(
        rectangle(0.6, 0.3).stroke("gray").strokewidth(1.5),
        line(V2(-0.2, -0.1), V2(-0.2, 0.1)),
        line(V2(0, -0.1), V2(0, 0.1)),
        line(V2(0.2, -0.1), V2(0.2, 0.1)),
    ).position(V2(-7.2, -3.9)),
    text("Light as measured by the observer").fontfamily("Math").fontsize(20).position(V2(-4.45, -3.9)),
).translate(V2(4.9, 0))

let stat = diagram_combine(div, leg)

let outline = rectangle(16, 9).strokewidth(0);

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let t = inp["t"]
    let v1 = inp["v₁"] / 100 * c
    let v2 = inp["v₂"] / 100 * c
    let w = inp["ω₀"] / 10
    let f = w * 1000 / (Math.PI * 2)

    let f_back = f * Math.sqrt((1 - v1 / c) / (1 + v1 / c))
    let f_front = f * Math.sqrt((1 + v1 / c) / (1 - v1 / c))
    let lambda_back = c / f_back
    let lambda_front = c / f_front
    let col_back = getLightColor(f_back)
    let col_front = getLightColor(f_front)

    let x = -4 + t * v1
    let o1 = -7.5 + t * v2
    let o2 = 7.5 - t * v2

    let light = []

    let v_rel1 = (v1 - v2) / (1 - (v1 * v2) / (c * c))
    let f_obs1 = f * Math.sqrt((1 - v_rel1 / c) / (1 + v_rel1 / c))
    let lambda_obs1 = c / f_obs1

    let v_rel2 = (v1 + v2) / (1 + (v1 * v2) / (c * c))
    let f_obs2 = f * Math.sqrt((1 + v_rel2 / c) / (1 - v_rel2 / c))
    let lambda_obs2 = c / f_obs2

    const SCALE = 100;

    let space_back = lambda_back * SCALE
    let dX_back = ((c + v1) * t) % space_back
    for (let X = x - dX_back - (space_back * 2); X >= -8; X -= space_back) {
        light.push(line(V2(0, -0.3), V2(0, 0.3)).stroke(col_back).position(V2(X, 1)))
    }

    let dX_front = ((c - v1) * t) % (lambda_front * SCALE)
    for (let X = x + dX_front + (lambda_front * SCALE * 2); X <= 8; X += lambda_front * SCALE) {
        light.push(line(V2(0, -0.3), V2(0, 0.3)).stroke(col_front).position(V2(X, 1)))
    }

    let box1 = diagram_combine(
        rectangle(1.5, 1).stroke("gray").strokewidth(1.5),
        ...(() => {
            let obs_light = []
            let space1 = lambda_obs1 * SCALE
            let dX = (c * t) % space1

            for (let X = 0.7 - dX; X >= -0.7; X -= space1) {
                obs_light.push(line(V2(0, -0.3), V2(0, 0.3)).stroke(getLightColor(f_obs1)).position(V2(X, 0)))
            }
            return obs_light
        })()
    ).position(V2(o1 + 0.6, 2.3))

    let box2 = diagram_combine(
        rectangle(1.5, 1).stroke("gray").strokewidth(1.5),
        ...(() => {
            let obs_light = []
            let space2 = lambda_obs2 * SCALE
            let dX = (c * t) % space2

            for (let X = -0.7 + dX; X <= 0.7; X += space2) {
                obs_light.push(line(V2(0, -0.3), V2(0, 0.3)).stroke(getLightColor(f_obs2)).position(V2(X, 0)))
            }
            return obs_light
        })()
    ).position(V2(o2 - 0.6, 2.3))

    let obs1 = square(0.3).position(V2(o1, 1)).strokewidth(0).fill("lightblue")
    let obs2 = square(0.3).position(V2(o2, 1)).strokewidth(0).fill("lightblue")

    let visual_w = (Math.PI * 2) * f * Math.sqrt(1 - (v1 * v1) / (c * c)) / SCALE
    let emit_y = Math.sin(visual_w * t) * 0.03 + 1

    let emit = circle(0.15).strokewidth(0).fill("lightred").position(V2(x, emit_y))

    draw(outline, ...light, obs1, obs2, emit, box1, box2, stat)
}

int.slider("t", 0, 10, 0, 0.02, 10, (name, value) => name + " = " + (value).toFixed(2) + " s")
int.slider("ω₀", 30, 36, 33, 0.1, 10, (name, value) => name + " = " + (value / 10).toFixed(2) + " ⋅ 10¹⁵ rad/s")
int.slider("v₁", 5, 20, 15, 1, 10, (name, value) => name + " = " + (value / 100).toFixed(2) + "c")
int.slider("v₂", 0, 15, 0, 1, 10, (name, value) => name + " = " + (value / 100).toFixed(2) + "c")

int.draw()
int.draw()