import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, V2, arc, to_radian, circle, line, boolean, square, curve, arrow1, xycorneraxes, xyaxes, plotf, text,
    axes_transform,
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

const release_pos = V2(3.3, 0.5)
const radius = 1
const electro_pos = V2(-1.7, 0.5)
const length = 4.5
const detail = 100
const SCALE = 0.13

let outline = rectangle(16, 9).strokewidth(0);
let divider = line(V2(-2.5, 4.5), V2(-2.5, -4.5)).stroke("black")

let ax_opt = {
    xrange: [0, 10],
    yrange: [0, 12],
    yticks: [0, 3, 6, 9, 12],
    xticks: [1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3],
    bbox: [V2(-7.5, -4), V2(-3, -1)],
    headsize: 0.1
}

let ax_opt2 = {
    xrange: [0, 10],
    yrange: [0, 12],
    yticks: [0, 3, 6, 9, 12],
    xticks: [1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3],
    bbox: [V2(-7.5, 0), V2(-3, 3)],
    headsize: 0.1
}

let t1 = text("t (s)").fontfamily("Math").fontsize(20).position(V2(-3, -4.3))
let t2 = text("t (s)").fontfamily("Math").fontsize(20).position(V2(-3, -0.3))
let v1 = text("v (m/s)").fontfamily("Math").fontsize(20).position(V2(-7.3, -0.7))
let v2 = text("v (m/s)").fontfamily("Math").fontsize(20).position(V2(-7.3, 3.2))
let lab = text("v indicates the magnitude of").position(V2(-5, 4.2)).fontfamily("Math").fontsize(20)
let lab2 = text(" velocity in the vertical direction").position(V2(-5, 3.9)).fontfamily("Math").fontsize(20)
let label = diagram_combine(t1, t2, v1, v2, lab, lab2)

let int = new Interactive(control, canvas);

let cache = []
let path = []
int.draw_function = (inp) => {
    let t = inp["t"]
    let g = inp["g"]
    let theta = to_radian(inp["θ"])
    let m1 = inp["m1"]
    let m2 = inp["m2"]

    let rotator = arc(radius, theta).rotate(-Math.PI / 2).position(release_pos.add(V2(0, radius)))
    let slope = line(rotator.get_anchor("top-right"), rotator.get_anchor("top-right").add(V2(length, 0).rotate(theta)))
    let slide = diagram_combine(rotator, slope).stroke("lightgray").strokewidth(5).translate(V2(0, -1).rotate(theta).scale(0.03))

    let ball_radius = 0.15 * Math.cbrt(m1)
    let outside = circle(ball_radius).fill("lightblue").strokewidth(0)
    let inside = boolean.difference(circle(ball_radius), diagram_combine(square(ball_radius).translate(V2(ball_radius * 0.5, ball_radius * 0.5)), square(ball_radius).translate(V2(-ball_radius * 0.5, -ball_radius * 0.5))))
        .strokewidth(0).fill("#9cbeef")
    let ball = diagram_combine(outside, inside).mut()

    let ball2_radius = 0.15 * Math.cbrt(m2)
    let outside2 = circle(ball2_radius).fill("lightblue").strokewidth(0)
    let inside2 = boolean.difference(circle(ball2_radius), diagram_combine(square(ball2_radius).translate(V2(ball2_radius * 0.5, ball2_radius * 0.5)), square(ball2_radius).translate(V2(-ball2_radius * 0.5, -ball2_radius * 0.5))))
        .strokewidth(0).fill("#9cbeef")
    let ball2 = diagram_combine(outside2, inside2).mut().position(electro_pos.add(V2(0, ball2_radius)))

    let slope_x = (x) => 5 / 14 * g * Math.sin(theta) * Math.pow(x, 2)
    let slope_v = 5 / 7 * g * Math.sin(theta) * t
    let slope_end_t = Math.sqrt(14 * length / (5 * g * Math.sin(theta)))
    let rotator_v = Math.sqrt(14 / 5 * g * length * Math.sin(theta)) * 5 / 7
    let rotator_end_t = slope_end_t + (radius * theta / rotator_v)
    let free_v_y = - g * (t - rotator_end_t)
    let free_x = (x) => rotator_v * (x - rotator_end_t)
    let free_y = (x) => -1 / 2 * g * Math.pow(x - rotator_end_t, 2)
    let collision_t = rotator_end_t + (Math.abs(release_pos.x - electro_pos.x) - ball_radius - ball2_radius) / rotator_v
    let land_t = rotator_end_t + Math.sqrt(2 * Math.abs(electro_pos.y + 3.5) / g)

    let ball_start_pos = V2(0, 1).rotate(theta).scale(ball_radius).add(slope.get_anchor("top-right"))
    let slope_dir = V2(1, 0).rotate(theta).scale(-1)

    let alpha = (x) => rotator_v * (x - slope_end_t) / radius

    if (cache.length === 0 || cache[0] !== g || cache[1] !== theta || cache[2] !== m1 || cache[3] !== m2) {
        cache = [g, theta, m1, m2]
        path = []
        for (let time = 0; time < land_t; time += land_t / detail) {
            if (time < slope_end_t) {
                path.push(ball_start_pos.add(slope_dir.scale(slope_x(time))))
            }
            if (time >= slope_end_t && time < rotator_end_t) {
                path.push(V2(0, -radius + ball_radius).rotate(theta - alpha(time)).add(release_pos.add(V2(0, radius))))
            }
            if (time >= rotator_end_t && time < collision_t) {
                path.push(release_pos.add(V2(0, ball_radius)).add(V2(-free_x(time), free_y(time))))
            }
            if (time >= collision_t) {
                path.push(V2(electro_pos.x + ball2_radius + ball_radius, release_pos.y + ball_radius).add(V2(0, free_y(time))))
            }
        }
        path.push(V2(electro_pos.x + ball2_radius + ball_radius, -3.5 + ball_radius))
    }

    let ball_path = curve(path).stroke("gray").strokedasharray([10])
    let ball2_path = line(V2(electro_pos.x, -3.5 + ball2_radius), electro_pos.add(V2(0, ball2_radius))).stroke("gray").strokedasharray([10])
    let ground = curve([V2(electro_pos.x - ball2_radius, -1), V2(electro_pos.x - ball2_radius, -3.5), V2(electro_pos.x + 1.4, -3.5)])
        .stroke("lightgray").strokewidth(5).translate(V2(-1, -1).normalize().scale(0.03))

    let l1 = square(0)
    let l2 = square(0)
    let vx = square(0)
    let vy = square(0)
    let v = square(0)
    let v2 = square(0)

    if (t >= 0 && t < slope_end_t) {
        ball.position(ball_start_pos.add(slope_dir.scale(slope_x(t))))
        ball.rotate(slope_x(t) / ball_radius)

        let v_vector = slope_dir.scale(slope_v * SCALE)
        let vx_vector = V2(0, -1).scale(v_vector.dot(V2(0, -1)))
        let vy_vector = V2(-1, 0).scale(v_vector.dot(V2(-1, 0)))
        v = arrow1(ball.origin, ball.origin.add(v_vector), 0.1).strokewidth(3).stroke("red").fill("red")
        vy = arrow1(ball.origin, ball.origin.add(vx_vector), 0.1).stroke("lightblue").fill("lightblue").strokewidth(3)
        vx = arrow1(ball.origin, ball.origin.add(vy_vector), 0.1).stroke("lightred").fill("lightred").strokewidth(3)

        l1 = line(ball.origin.add(vx_vector), ball.origin.add(v_vector)).strokedasharray([10]).stroke("gray")
        l2 = line(ball.origin.add(vy_vector), ball.origin.add(v_vector)).strokedasharray([10]).stroke("gray")
    }
    if (t >= slope_end_t && t < rotator_end_t) {
        let ball_pos = V2(0, -radius + ball_radius).rotate(theta - alpha(t)).add(release_pos.add(V2(0, radius)))
        ball.position(ball_pos)
        ball.rotate(length / ball_radius + rotator_v / ball_radius * (t - slope_end_t))

        let v_vector = slope_dir.rotate(-alpha(t)).scale(rotator_v * SCALE)
        let vx_vector = V2(0, -1).scale(v_vector.dot(V2(0, -1)))
        let vy_vector = V2(-1, 0).scale(v_vector.dot(V2(-1, 0)))
        v = arrow1(ball.origin, ball.origin.add(v_vector), 0.1).strokewidth(3).stroke("red").fill("red")
        vy = arrow1(ball.origin, ball.origin.add(vx_vector), 0.1).stroke("lightblue").fill("lightblue").strokewidth(3)
        vx = arrow1(ball.origin, ball.origin.add(vy_vector), 0.1).stroke("lightred").fill("lightred").strokewidth(3)

        l1 = line(ball.origin.add(vx_vector), ball.origin.add(v_vector)).strokedasharray([10]).stroke("gray")
        l2 = line(ball.origin.add(vy_vector), ball.origin.add(v_vector)).strokedasharray([10]).stroke("gray")
    }
    if (t >= rotator_end_t && t < collision_t) {
        ball.position(release_pos.add(V2(0, ball_radius)).add(V2(-free_x(t), free_y(t))))
        ball.rotate(length / ball_radius + rotator_v / ball_radius * (rotator_end_t - slope_end_t) + rotator_v / ball_radius * (t - rotator_end_t))

        ball2.position(electro_pos.add(V2(0, ball2_radius)).add(V2(0, free_y(t))))

        let vx_vector = V2(-1, 0).scale(rotator_v * SCALE)
        let vy_vector = V2(0, 1).scale(free_v_y * SCALE)
        v = arrow1(ball.origin, ball.origin.add(vx_vector).add(vy_vector), 0.1).strokewidth(3).stroke("red").fill("red")
        vy = arrow1(ball.origin, ball.origin.add(vy_vector), 0.1).stroke("lightblue").fill("lightblue").strokewidth(3)
        vx = arrow1(ball.origin, ball.origin.add(vx_vector), 0.1).stroke("lightred").fill("lightred").strokewidth(3)

        l1 = line(ball.origin.add(vx_vector), ball.origin.add(vx_vector).add(vy_vector)).strokedasharray([10]).stroke("gray")
        l2 = line(ball.origin.add(vy_vector), ball.origin.add(vy_vector).add(vx_vector)).strokedasharray([10]).stroke("gray")

        v2 = arrow1(ball2.origin, ball2.origin.add(V2(0, (-g * (t - rotator_end_t)) * SCALE)), 0.1).strokewidth(3).stroke("blue").fill("blue")
    }
    if (t >= collision_t && t < land_t) {
        ball.position(V2(electro_pos.x + ball2_radius + ball_radius, release_pos.y + ball_radius).add(V2(0, free_y(t))))
        ball.rotate(length / ball_radius + rotator_v / ball_radius * (rotator_end_t - slope_end_t))
        ball2.position(electro_pos.add(V2(0, ball2_radius)).add(V2(0, free_y(t))))

        v = arrow1(ball.origin, ball.origin.add(V2(0, (-g * (t - rotator_end_t)) * SCALE)), 0.1).strokewidth(3).stroke("red").fill("red")
        v2 = arrow1(ball2.origin, ball2.origin.add(V2(0, (-g * (t - rotator_end_t)) * SCALE)), 0.1).strokewidth(3).stroke("blue").fill("blue")
    }
    if (t >= land_t) {
        ball.position(V2(electro_pos.x + ball2_radius + ball_radius, -3.5 + ball_radius))
        ball2.position(V2(electro_pos.x, -3.5 + ball2_radius))
    }

    ax_opt.xrange = [rotator_end_t, land_t]
    ax_opt2.xrange = [rotator_end_t, land_t]
    let ax = xycorneraxes(ax_opt).fontsize(20).fontfamily("Math").textfill("black").stroke("black").fill("black")
    let ax2 = xycorneraxes(ax_opt2).fontsize(20).fontfamily("Math").textfill("black").stroke("black").fill("black")
    let plot1 = plotf((x) => g * (x - rotator_end_t), ax_opt).stroke("blue").strokewidth(2)
    let plot2 = plotf((x) => g * (x - rotator_end_t), ax_opt2).stroke("lightblue").strokewidth(2)

    let transf1 = axes_transform(ax_opt)
    let transf2 = axes_transform(ax_opt2)
    let timeline1 = square(0)
    let timeline2 = square(0)
    let v_circ_1 = square(0)
    let v_circ_2 = square(0)
    if (t > rotator_end_t && t < land_t) {
        timeline1 = line(V2(t, 0).apply(transf1), V2(t, 12).apply(transf1)).stroke("gray").strokedasharray([10])
        timeline2 = line(V2(t, 0).apply(transf2), V2(t, 12).apply(transf2)).stroke("gray").strokedasharray([10])
        v_circ_1 = circle(0.05).position(V2(t, g * (t - rotator_end_t)).apply(transf1)).strokewidth(0).fill("blue")
        v_circ_2 = circle(0.05).position(V2(t, g * (t - rotator_end_t)).apply(transf2)).strokewidth(0).fill("lightblue")
    }

    let ring = arc(0.5, Math.PI).rotate(Math.PI / 2).move_origin("bottom-right").position(release_pos).scale(V2(0.4, 1)).stroke("gray")
    let ring_top = arc(0.5, Math.PI).rotate(-Math.PI / 2).move_origin("bottom-left").position(release_pos).scale(V2(0.4, 1)).stroke("gray")
    let cable = curve([release_pos.add(V2(0, 1)), release_pos.add(V2(0, 3)), release_pos.add(V2(-release_pos.x + electro_pos.x, 3)), electro_pos.add(V2(0, 2 * ball2_radius))])
        .strokewidth(2).stroke("lightgray").strokelinejoin("round")
    let control = rectangle(1, 0.7).position(V2((electro_pos.x + release_pos.x) / 2, release_pos.y + 3)).stroke(0).fill("lightgray")
    let controlpanel = circle(0.1).position(control.get_anchor("center-center")).fill((t > rotator_end_t) ? "lightgreen" : "lightred").stroke(0)
    let release = rectangle(0.1, 0.3).move_origin("bottom-center").position(electro_pos.add(V2(0, 2 * ball2_radius))).stroke(0).fill("gray")
    let machine = diagram_combine(ring, cable, control, controlpanel, release)

    draw(outline, divider, machine, slide, ball_path, ball2_path, l1, l2, ground, v, vx, vy, v2, ball, ball2, ring_top, timeline1, timeline2, v_circ_1, v_circ_2, ax, plot1, ax2, plot2, label)
}

int.slider("t", 0, 4, 0, 0.02, 4, (name, value) => name + " = " + value.toFixed(2) + " s")
int.slider("g", 7, 12, 9.81, 0.01, 10, (name, value) => name + " = " + value.toFixed(2) + " m/s²")
int.slider("θ", 30, 45, 30, 1, 10, (name, value) => name + " = " + value.toFixed(0) + "°")
int.slider("m1", 1, 3, 2, 0.1, 10, (name, value) => "M" + " = " + value.toFixed(1) + " kg")
int.slider("m2", 1, 3, 3, 0.1, 10, (name, value) => "m" + " = " + value.toFixed(1) + " kg")

int.draw()
int.draw()