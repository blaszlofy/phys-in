import {
    rectangle,
    draw_to_svg,
    diagram_combine,
    Interactive, V2, circle, polygon, geometry, text, arrow, line, arrow1, plotv, xycorneraxes, plotf, square,
    axes_transform,
} from "diagramatics";

let canvas = document.getElementById("canvas");
let control = document.getElementById("control");

let draw = (...diagrams) => {
    draw_to_svg(canvas, diagram_combine(...diagrams));
};

function calcE(M, e, detail) {
    let E = M;
    for (let i = 0; i < detail; i++) {
        let f = E - e * Math.sin(E) - M;
        let f_der = 1 - e * Math.cos(E);
        E = E - (f / f_der);
    }
    return E;
}

//TODO: Merge these functions into one

function ellipseParameters(planet, focal2, focal1) {
    let a = (planet.sub(focal1).length() + planet.sub(focal2).length()) / 2
    let center = focal1.add(focal2).scale(0.5)
    let c = focal1.sub(center).length()
    let b = Math.sqrt(Math.pow(a, 2) - Math.pow(c, 2))
    let u = focal2.sub(center).normalize()
    let v = u.rotate(Math.PI / 2).normalize()
    return {a: a, b: b, c: c, center: center, u: u, v: v};
}

function ellipse(planet, focal2, focal1, detail, startE = 0, endE = Math.PI * 2) {
    let a = (planet.sub(focal1).length() + planet.sub(focal2).length()) / 2
    let center = focal1.add(focal2).scale(0.5)
    let c = focal1.sub(center).length()
    let b = Math.sqrt(Math.pow(a, 2) - Math.pow(c, 2))
    let u = focal2.sub(center).normalize()
    let v = u.rotate(Math.PI / 2).normalize()
    let path = []
    for (let E = startE; E < endE; E += (endE - startE) / detail) {
        path.push(center.add(u.scale(a * Math.cos(E))).add(v.scale(b * Math.sin(E))))
    }
    return polygon(path)
}

function ellipseSector(planet, focal2, focal1, detail, startE, endE) {
    let a = (planet.sub(focal1).length() + planet.sub(focal2).length()) / 2
    let center = focal1.add(focal2).scale(0.5)
    let c = focal1.sub(center).length()
    let b = Math.sqrt(Math.pow(a, 2) - Math.pow(c, 2))
    let u = focal2.sub(center).normalize()
    let v = u.rotate(Math.PI / 2).normalize()

    let path = [focal2]

    for (let i = 0; i <= detail; i++) {
        let E = startE + (endE - startE) * (i / detail)
        path.push(center.add(u.scale(a * Math.cos(E))).add(v.scale(b * Math.sin(E))))
    }
    return polygon(path)
}

function plotVelocities(ellipse_params, M, m, G, period, data_points = 50) {
    let data = []
    let dt = period / data_points
    let e = ellipse_params.c / ellipse_params.a

    for (let i = 0; i <= data_points; i++) {
        let t = i * dt
        let mean_anomaly = 2 * Math.PI * (t / period)
        let E = calcE(mean_anomaly, e, 10)

        let pos = ellipse_params.center
            .add(ellipse_params.u.scale(ellipse_params.a * Math.cos(E)))
            .add(ellipse_params.v.scale(ellipse_params.b * Math.sin(E)))

        let dist_to_star = pos.sub(star_pos).length()

        let v = Math.sqrt(G * M * ((2 / dist_to_star) - (1 / ellipse_params.a)))
        data.push(V2(t, v))
    }
    return data
}

function plotForces(ellipse_params, M, m, G, period, data_points = 50) {
    let data = []
    let dt = period / data_points
    let e = ellipse_params.c / ellipse_params.a

    for (let i = 0; i <= data_points; i++) {
        let t = i * dt
        let mean_anomaly = 2 * Math.PI * (t / period)
        let E = calcE(mean_anomaly, e, 10)

        let pos = ellipse_params.center
            .add(ellipse_params.u.scale(ellipse_params.a * Math.cos(E)))
            .add(ellipse_params.v.scale(ellipse_params.b * Math.sin(E)))

        let dist_to_star = pos.sub(star_pos).length()

        let f = G * M * m / Math.pow(dist_to_star, 2)

        //0.1 is just for visual scaling, one unit is 10e20 instead of 10e19 Newtons then
        data.push(V2(t, 0.1 * f))
    }
    return data
}

const disp = 16
let star_pos = V2(-4, -2)
let planet_pos = V2(3, 0)
let focal_pos = V2(3, 0)

//STATIC
let outline = rectangle(16, 9).strokewidth(0);
let r1_legend = line(V2(0, 0), V2(0.5, 0)).strokedasharray([10]).stroke("blue")
let r2_legend = line(V2(0, 0), V2(0.5, 0)).strokedasharray([10]).stroke("red")

let v_f_plot = {
    xrange: [0, 22.5],
    yrange: [0, 20],
    yticks: [0, 4, 8, 12, 16, 20],
    bbox: [V2(0.5, -0.8), V2(7.5, 2.7)],
    headsize: 0.1
}

let divider1 = line(V2(0, 4.5), V2(0, -4.5))
let divider2 = line(V2(0, 3), V2(8, 3))
let divider3 = line(V2(0, -3), V2(8, -3))
let dividers = diagram_combine(divider1, divider2, divider3)

let t_lab = text("t (10⁷ s)").fontfamily("Math").fontsize(20).position(V2(7.45, -0.1))
let F_lab = text("F (10²⁰ N) - magnitude of the force between the two bodies").fontfamily("Math").fontsize(20).position(V2(4.2, -1.3))
let v_lab = text("v (10⁴ m/s) - magnitude of the velocity of the orbiting body").fontfamily("Math").fontsize(20).position(V2(4.21, -1.9))
let F_line = line(V2(0, 0), V2(0.5, 0)).strokewidth(3).stroke("blue").position(V2(0.15, -1.3))
let v_line = line(V2(0, 0), V2(0.5, 0)).strokewidth(3).stroke("red").position(V2(0.15, -1.9))
let labels = diagram_combine(t_lab, F_lab, v_lab, F_line, v_line).translate(V2(0, -0.4))

let int = new Interactive(control, canvas);


let areas = []
let values = []
let velocities = []
let forces = []
let planet_cache, focal_cache, m_cache, M_cache, G_cache
let show_areas = false
int.draw_function = (inp) => {
    planet_pos = inp["p"]
    focal_pos = inp["f"]
    let M = inp["M"]
    let m = inp["m"]
    let t = inp["t"]
    let G = inp["G"]

    let ellipse_params = ellipseParameters(planet_pos, star_pos, focal_pos)
    let e = ellipse_params.c / ellipse_params.a

    let period = 2 * Math.PI * Math.sqrt(Math.pow(ellipse_params.a, 3) / (G * M))
    let interval = period / disp

    let mean_anomaly = 2 * Math.PI * ((t % period) / period);
    let E = calcE(mean_anomaly, e, 10)

    if (t > period && int.intervals["t"] !== undefined) {
        int.set("t", 0)
    }

    let total_areas = Math.floor(t / (2 * interval));

    areas = []
    for (let i = 0; i <= total_areas; i++) {
        let t_start = i * 2 * interval
        let t_end = t_start + interval

        if (t_start > t) break
        if (t_end > t) t_end = t

        let E_start = calcE(2 * Math.PI * (t_start / period), e, 10)
        let E_end = calcE(2 * Math.PI * (t_end / period), e, 10)

        areas.push(ellipseSector(planet_pos, star_pos, focal_pos, 20, E_start, E_end)
            .fill("#d6e3f3").strokewidth(0))
    }

    let pos_on_orbit = ellipse_params.center.add(ellipse_params.u.scale(ellipse_params.a * Math.cos(E))).add(ellipse_params.v.scale(ellipse_params.b * Math.sin(E)))

    let star = circle(0.2 * Math.cbrt(M)).strokewidth(0).fill("lightblue").position(star_pos)
    let orbit = ellipse(planet_pos, star_pos, focal_pos, 100).stroke("gray")
    let planet = circle(0.05 * Math.cbrt(m)).position(pos_on_orbit).strokewidth(0).fill("lightblue")

    let r1 = line(focal_pos, pos_on_orbit).strokedasharray([10]).stroke("blue")
    let r2 = line(star_pos, pos_on_orbit).strokedasharray([10]).stroke("red")
    let r = diagram_combine(r1, r2)

    let dir_to_star = star_pos.sub(pos_on_orbit).normalize()
    let dist_to_star = star_pos.sub(pos_on_orbit).length()
    let force_factor = 0.02 * G * M * m / Math.pow(dist_to_star, 2)
    let force = arrow1(pos_on_orbit, dir_to_star.scale(force_factor).add(pos_on_orbit), 0.1).stroke("blue").fill("blue").strokewidth(3)

    let v = 0.3 *  Math.sqrt(G * M * ((2 / dist_to_star) - (1 / ellipse_params.a)))
    let tangent_dir = ellipse_params.u.scale(-ellipse_params.a * Math.sin(E))
        .add(ellipse_params.v.scale(ellipse_params.b * Math.cos(E)))
        .normalize()
    let velocity =  arrow1(pos_on_orbit, tangent_dir.scale(v).add(pos_on_orbit), 0.1).fill("red").stroke("red").strokewidth(3)

    let legend = diagram_combine(
        r1_legend.translate(V2(0, 0.01)), text(r1.path_length().toFixed(2).toString()).fontfamily("Math").fontsize(20).translate(V2(0.8, 0)),
        text("+").fontfamily("Math").fontsize(20).translate(V2(1.2, 0)),
        r2_legend.translate(V2(1.4, 0.01)), text(r2.path_length().toFixed(2).toString()).fontfamily("Math").fontsize(20).translate(V2(2.2, 0)),
        text(" = ").fontfamily("Math").fontsize(20).translate(V2(2.7, 0)),
        text((r1.path_length() + +r2.path_length()).toFixed(2)).fontfamily("Math").fontsize(20).translate(V2(3.2, 0)),
    ).position(V2(2.1, 3.8))

    if (planet_cache !== planet_pos || focal_cache !== focal_pos || m_cache !== m || M_cache !== M || G_cache !== G) {
        planet_cache = planet_pos
        focal_cache = focal_pos
        m_cache = m
        M_cache = M
        G_cache = G

        velocities = plotVelocities(ellipse_params, M, m, G, period)
        forces = plotForces(ellipse_params, M, m, G, period)
    }

    values = []
    if (show_areas) {
        for (let i = 0; i < Math.min(areas.length, disp/2); i++) {
            values.push(text(geometry.area(areas[i]).toFixed(2) + " ⋅ 10²² m²").fontfamily("Math").fontsize(15).position(areas[i].get_anchor("center-center")))
        }
    }

    let period_text = text("T = " + period.toFixed(2) + " ⋅ 10⁷ s").fontfamily("Math").fontsize(20).position(V2(4, -3.8))

    let v_f_axes = xycorneraxes(v_f_plot).fontsize(20).fontfamily("Math").stroke("black").fill("black").textfill("black")
    let v_plot = plotv(velocities, v_f_plot).stroke("red").strokewidth(2)
    let f_plot = plotv(forces, v_f_plot).stroke("blue").strokewidth(2)
    let transf = axes_transform(v_f_plot)
    let time_line = line(V2((t % period), 0).apply(transf), V2((t % period), 20).apply(transf)).strokedasharray([10]).stroke("gray")
    let force_point = circle(0.05).fill("blue").strokewidth(0).position(V2((t % period), Math.min(20, force_factor * 5)).apply(transf))
    let velocity_point = circle(0.05).fill("red").strokewidth(0).position(V2((t % period), v / 0.3).apply(transf))
    let plot_combined = diagram_combine(v_f_axes, v_plot, f_plot, time_line, force_point, velocity_point)

    draw(dividers, outline, ...areas, r, star, ...values, force, velocity, orbit, planet, legend, plot_combined, labels, period_text)
}

int.locator("p", V2(-4, -4), 0.2, "blue", null, true, null, {type: "circle", center: V2(-4, -3.4), radius: 0.6})
int.locator("f", V2(-4, 2), 0.2, "lightgray", null, true, null, {type: "circle", center: V2(-4, 1), radius: 1})

int.slider("t", 0, 30, 0, 0.02, 30, (name, value) => name + " = " + value.toFixed(2) + " ⋅ 10⁷ s")
int.slider("M", 1, 2.5, 1.98, 0.01, 10, (name, value) => name + " = " + value.toFixed(2) + " ⋅ 10³⁰ kg")
int.slider("m", 4, 13, 5.97, 0.01, 10, (name, value) => name + " = " + value.toFixed(2) + " ⋅ 10²⁴ kg ")
int.slider("G", 6, 8, 6.67, 0.01, 10, (name, value) => name + " = " + value.toFixed(2) + " ⋅ 10⁻¹¹ m³/kg⋅s²")

int.draw()
int.draw()

int.locator_initial_draw()

let btn = document.getElementById("areas");
btn.onclick = () => {
    show_areas = !show_areas
    int.draw()
}