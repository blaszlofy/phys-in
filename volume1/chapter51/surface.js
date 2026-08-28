import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive,
    draw_to_svg_element,
    handle_tex_in_svg, circle, V2, polygon, square, line, text
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

const A = 0.5
const y_top = 2.5
const y_bottom = -2
const x_left = -7
const x_right = 7
const x_res = 13
const y_res = 4

let outline = rectangle(16, 9).strokewidth(0);

let div = line(V2(-8, -2.5), V2(8, -2.5))

let part_l = circle(0.07).strokewidth(0).fill("lightblue").position(V2(-3, -3.1))
let point_l = circle(0.1).strokewidth(0).fill("blue").position(V2(-3, -3.9))
let part_t = text("Water particles moving in circles").fontfamily("Math").fontsize(20).position(V2(-0.68, -3.1))
let point_t = text("Point moving at phase velocity").fontfamily("Math").fontsize(20).position(V2(-0.8, -3.9))

let leg = diagram_combine(part_l, point_l, part_t, point_t).translate(V2(1, 0))

let stat = diagram_combine(div, leg)

let int = new Interactive(control, canvas);

int.draw_function = (inp) => {
    let t = inp["t"]
    let g = inp["g"] / 100
    let lambda = inp["λ"]

    let k = 2 * Math.PI / lambda
    let w = Math.sqrt(g * k)
    let R = (y) => A * Math.exp(k * y)

    let v = Math.sqrt(g * lambda / (Math.PI * 2))

    let point = circle(0.1).strokewidth(0).fill("blue").position(V2((v * t) % (x_right - x_left) - x_right, 4))

    let i = 0
    let particles = []
    let circles = []
    for (let x = x_left; x <= x_right; x += (x_right - x_left) / x_res) {
        i++
        for (let y = y_bottom; y <= y_top; y += (y_top - y_bottom) / y_res) {
            if (i === 5) {
                circles.push(circle(R(y - y_top)).strokewidth(1.5).stroke("gray").strokedasharray([6]).position(V2(x, y)))
            }
            particles.push(
                circle(0.07).strokewidth(0).fill("lightblue").position(V2(x - R(y - y_top) * Math.sin(k * x - w * t), y + R(y - y_top) * Math.cos(k * x - w * t)))
            )
        }
    }

    const dy = 0.25
    let water_points = []
    water_points.push(V2(x_left - A - dy, y_top - A))

    for (let x = x_left - 3 * A; x <= x_right + 3 * A; x += 0.05) {
        let _x = x - R(dy) * Math.sin(k * x - w * t)
        if (_x < x_left - A - dy || _x > x_right + A + dy) continue
        water_points.push(V2(_x, y_top + dy + R(dy) * Math.cos(k * x - w * t)))
    }

    water_points.push(V2(x_right + A + dy, y_top - A))
    water_points.push(V2(x_right + A + dy, y_bottom - dy), V2(x_left - A - dy, y_bottom - dy))
    let water = polygon(water_points).strokewidth(0).fill("lightblue").opacity(0.3)

    const boat_x0 = 3.5
    let phase = k * boat_x0 - w * t;
    let boat_angle = Math.atan2(-R(dy) * k * Math.sin(phase), 1 - R(dy) * k * Math.cos(phase))
    let boat = diagram_combine(
        polygon([V2(-0.3, 0), V2(0.3, 0), V2(0.45, 0.15), V2(0.02, 0.15), V2(0.02, 0.25), V2(-0.02, 0.25), V2(-0.02, 0.15), V2(-0.45, 0.15)]).strokewidth(0).fill("lightbrown"),
        polygon([V2(-0.05, 0.2), V2(0.3, 0.4), V2(-0.05, 0.6)]).strokewidth(0).fill("lightgray")
    ).rotate(boat_angle).position(V2(boat_x0 - R(dy) * Math.sin(phase), y_top + dy * 0.8 + R(dy) * Math.cos(phase)))

    draw(outline, water, ...circles, ...particles, point, boat, stat)
}

int.slider("t", 0, 15, 0, 0.02, 15, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("λ", 6, 12, 7, 0.1, 15, (name, value) => name + " = " + value.toFixed(1) + " m")
int.slider("g", 500, 1300, 981, 10, 15, (name, value) => name + " = " + (value / 100).toFixed(2) + " m/s²")

int.draw()
int.draw()