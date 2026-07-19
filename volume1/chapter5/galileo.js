import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, line, V2, polygon, to_radian, circle, boolean, square
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

const SCALE = 1/6;
const C = 0.07;
let l = 0;

let outline = rectangle(16, 9).strokewidth(1);
let divider = line(V2(1.5, -4.5), V2(1.5, 4.5))

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let t = inp["t"]
    let g = inp["g"]
    let theta = to_radian(inp["θ"])
    let m = inp["m"]

    let x = (1/2) * (g * Math.sin(theta)) / 1.4 * Math.pow(t, 2)
    let r = Math.cbrt(m)
    l = (12.5/1.4) * g * Math.sin(theta)
    let ball_angle = (x * SCALE)/(r * C)

    let top = V2(-7.5, -4 + (SCALE * l * Math.sin(theta)))
    let ramp = polygon([V2(-7.5, -4), V2(-7.5 + (SCALE * l * Math.cos(theta)), -4), top])
        .strokewidth(1).fill("lightgray")
    let dir = V2(1, 0).rotate(-theta).normalize()
    let offset = V2(0, r * C).rotate(-theta)
    let outside = circle(r * C).fill("lightblue").strokewidth(0)
    let inside = boolean.difference(circle(r * C), diagram_combine(square(r * C).translate(V2(r * C * 0.5, r * C * 0.5)), square(r * C).translate(V2(-r * C * 0.5, -r * C * 0.5))))
        .strokewidth(0).fill("blue")
    let ball = diagram_combine(outside, inside).rotate(-ball_angle).position(top.add(offset).add(dir.scale(x * SCALE)))


    draw(outline, divider, ramp, ball)
}

function timeFormat(name, value) {
    return (name + " = " + value.toFixed(2) + " s");
}

function accFormat(name, value) {
    return (name + " = " + value.toFixed(2) + " m/s²");
}

function angleFormat(name, value) {
    return (name + " = " + value.toFixed(2) + "°");
}

function massFormat(name, value) {
    return (name + " = " + value.toFixed(2) + " kg");
}

int.slider("t", 0, 5, 0, 0.01, 5, timeFormat)
int.slider("g", 5, 10, 9.81, 0.01, 10, accFormat)
int.slider("θ", 30, 45, 30, 1, 10, angleFormat)
int.slider("m", 10, 100, 50, 1, 10, massFormat)

int.draw()